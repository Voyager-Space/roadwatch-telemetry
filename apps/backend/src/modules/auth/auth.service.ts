import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponse, UserRole } from '@roadwatch/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    return this.generateAuthResponse(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    // Default to 'viewer' role for self-registration
    const viewerRole = await this.prisma.role.findUnique({
      where: { name: 'viewer' },
    });

    if (!viewerRole) {
      throw new BadRequestException('System roles not initialized properly');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        full_name: registerDto.fullName,
        phone_number: registerDto.phoneNumber,
        role_id: viewerRole.id,
      },
      include: { role: true },
    });

    this.logger.log(`New user registered: ${user.email}`);

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: any): AuthResponse {
    const payload = { sub: user.id, email: user.email, role: user.role.name };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: 'not-implemented-yet', // Can be expanded for refresh token rotation
      expiresIn: 86400, // 24h in seconds
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role.name as UserRole,
        phoneNumber: user.phone_number,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        avatarUrl: user.avatar_url,
      },
    };
  }
}