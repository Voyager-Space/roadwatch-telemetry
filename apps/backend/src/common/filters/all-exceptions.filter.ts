import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'string') {
        errorMessage = response;
      } else if (typeof response === 'object' && response !== null) {
        errorMessage = (response as any).message || errorMessage;
        errorCode = (response as any).error || errorCode;
        errorDetails = (response as any).details || null;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors
      httpStatus = HttpStatus.BAD_REQUEST;
      
      switch (exception.code) {
        case 'P2002':
          errorCode = 'UNIQUE_CONSTRAINT_VIOLATION';
          errorMessage = 'A record with this specific data already exists.';
          errorDetails = { target: exception.meta?.target };
          httpStatus = HttpStatus.CONFLICT;
          break;
        case 'P2025':
          errorCode = 'RECORD_NOT_FOUND';
          errorMessage = 'The requested record was not found in the database.';
          httpStatus = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          errorCode = 'FOREIGN_KEY_VIOLATION';
          errorMessage = 'Operation failed due to a foreign key constraint violation.';
          break;
        default:
          errorCode = `PRISMA_ERROR_${exception.code}`;
          errorMessage = 'A database operation failed.';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      errorCode = 'DATABASE_VALIDATION_ERROR';
      errorMessage = 'The provided data does not match the database schema.';
    } else {
      this.logger.error(
        `Unhandled exception: ${exception}`,
        exception instanceof Error ? exception.stack : undefined
      );
    }

    const responseBody = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        ...(errorDetails ? { details: errorDetails } : {}),
      },
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
    };

    if (httpStatus >= 500) {
      this.logger.error(`[${request.method}] ${request.url} - ${httpStatus} - ${errorMessage}`);
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${httpStatus} - ${errorMessage}`);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}