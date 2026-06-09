import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  PotholeFilterDto, 
  ChangeStatusDto, 
  PotholeStatus,
  PaginationParams
} from '@roadwatch/shared-types';
import { STATUS_WORKFLOW } from '@roadwatch/shared-utils';
import { Prisma } from '@prisma/client';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class PotholesService {
  private readonly logger = new Logger(PotholesService.name);

  constructor(private readonly prisma: PrismaService,
    private readonly wsGateway: AppWebSocketGateway
  ) {}

  private buildWhereClause(filters: PotholeFilterDto): Prisma.PotholeWhereInput {
    const where: Prisma.PotholeWhereInput = {};

    if (filters.status && filters.status.length > 0) {
      where.current_status = { in: filters.status as any[] };
    }

    if (filters.isArchived !== undefined) {
      where.is_archived = filters.isArchived;
    }

    if (filters.minSeverity !== undefined || filters.maxSeverity !== undefined) {
      where.severity_score = {
        ...(filters.minSeverity !== undefined && { gte: filters.minSeverity }),
        ...(filters.maxSeverity !== undefined && { lte: filters.maxSeverity }),
      };
    }

    if (filters.boundingBox) {
      where.latitude = {
        gte: filters.boundingBox.minLat,
        lte: filters.boundingBox.maxLat,
      };
      where.longitude = {
        gte: filters.boundingBox.minLng,
        lte: filters.boundingBox.maxLng,
      };
    }

    if (filters.search) {
      where.OR = [
        { pothole_code: { contains: filters.search, mode: 'insensitive' } },
        { road_name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async findAll(filters: PotholeFilterDto & PaginationParams) {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where = this.buildWhereClause(filters);

    const [data, totalItems] = await Promise.all([
      this.prisma.pothole.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [filters.sortBy || 'updated_at']: filters.sortOrder || 'desc',
        },
        include: {
          _count: { select: { events: true } },
        },
      }),
      this.prisma.pothole.count({ where }),
    ]);

    const mappedData = data.map(p => ({
      id: p.id,
      potholeCode: p.pothole_code,
      title: p.title,
      latitude: p.latitude,
      longitude: p.longitude,
      roadName: p.road_name,
      severityScore: p.severity_score,
      confidenceScore: p.confidence_score,
      riskScore: p.risk_score,
      currentStatus: p.current_status,
      detectedAt: p.detected_at,
      eventCount: p._count.events,
    }));

    return {
      data: mappedData,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        hasNextPage: skip + pageSize < totalItems,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getMapMarkers(filters: PotholeFilterDto) {
    const conditions = ['is_archived = false'];

    if (filters.status && filters.status.length > 0) {
      const statuses = filters.status.map(s => `'${s}'`).join(',');
      conditions.push(`current_status::text IN (${statuses})`);
    }

    if (filters.minSeverity !== undefined) conditions.push(`severity_score >= ${filters.minSeverity}`);
    if (filters.maxSeverity !== undefined) conditions.push(`severity_score <= ${filters.maxSeverity}`);

    let bboxQuery = '';
    if (filters.boundingBox) {
      const { minLng, minLat, maxLng, maxLat } = filters.boundingBox;
      bboxQuery = `AND ST_Contains(
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326),
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      )`;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')} ${bboxQuery}` 
      : bboxQuery ? `WHERE 1=1 ${bboxQuery}` : '';

    const markers = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, latitude, longitude, severity_score, current_status, pothole_code
      FROM potholes
      ${whereClause}
      LIMIT 5000;
    `);

    return markers.map(m => ({
      id: m.id,
      position: { lat: Number(m.latitude), lng: Number(m.longitude) },
      severity: m.severity_score >= 9 ? 'critical' : m.severity_score >= 7 ? 'high' : m.severity_score >= 5 ? 'medium' : 'low',
      status: m.current_status,
      potholeCode: m.pothole_code,
    }));
  }

  async findOne(id: string) {
    const pothole = await this.prisma.pothole.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { event_timestamp: 'desc' },
          take: 10,
        },
        history: {
          include: { user: { select: { full_name: true, email: true } } },
          orderBy: { changed_at: 'desc' },
        },
        tasks: {
          include: { assignee: { select: { full_name: true } } },
        },
        ai_summary: true,
        cluster: true,
      },
    });

    if (!pothole) {
      throw new NotFoundException(`Pothole with ID ${id} not found`);
    }

    // Explicitly mapping all snake_case properties to camelCase for frontend interfaces
    return {
      id: pothole.id,
      potholeCode: pothole.pothole_code,
      title: pothole.title,
      latitude: pothole.latitude,
      longitude: pothole.longitude,
      roadName: pothole.road_name,
      city: pothole.city,
      severityScore: pothole.severity_score,
      confidenceScore: pothole.confidence_score,
      riskScore: pothole.risk_score,
      currentStatus: pothole.current_status,
      detectedAt: pothole.detected_at,
      verifiedAt: pothole.verified_at,
      resolvedAt: pothole.resolved_at,
      resolutionNotes: pothole.resolution_notes,
      aiSummary: pothole.ai_summary ? {
        id: pothole.ai_summary.id,
        summaryText: pothole.ai_summary.summary_text,
        maintenanceNote: pothole.ai_summary.maintenance_note,
        repairRecommendation: pothole.ai_summary.repair_recommendation,
        generatedAt: pothole.ai_summary.generated_at
      } : null,
      cluster: pothole.cluster,
      events: pothole.events.map(e => ({
        id: e.id,
        impactForce: e.impact_force,
        speedEstimate: e.speed_estimate,
        gpsAccuracy: e.gps_accuracy,
        confidenceScore: e.confidence_score,
        eventTimestamp: e.event_timestamp,
      })),
      history: pothole.history.map(h => ({
        id: h.id,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        changedAt: h.changed_at,
        changeReason: h.change_reason,
        user: h.user ? {
          fullName: h.user.full_name,
          email: h.user.email,
        } : null
      })),
      tasks: pothole.tasks.map(t => ({
        id: t.id,
        taskStatus: t.task_status,
        priorityLevel: t.priority_level,
        taskNotes: t.task_notes,
        createdAt: t.created_at,
        assignee: t.assignee ? {
          fullName: t.assignee.full_name
        } : null
      }))
    };
  }

  async updateStatus(id: string, dto: ChangeStatusDto, userId: string) {
    const pothole = await this.prisma.pothole.findUnique({
      where: { id },
      select: { current_status: true },
    });

    if (!pothole) {
      throw new NotFoundException(`Pothole not found`);
    }

    const currentStatus = pothole.current_status as string;
    const newStatus = dto.newStatus as string;

    const allowedTransitions = STATUS_WORKFLOW[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus) && currentStatus !== newStatus) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }

    const updatedPothole = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.pothole.update({
        where: { id },
        data: {
          current_status: dto.newStatus as any,
          resolution_notes: dto.reason,
          ...(dto.newStatus === PotholeStatus.COMPLETED ? { resolved_at: new Date() } : {}),
          ...(dto.newStatus === PotholeStatus.VERIFIED ? { verified_at: new Date() } : {}),
        },
      });

      await tx.potholeStatusHistory.create({
        data: {
          pothole_id: id,
          old_status: currentStatus as any,
          new_status: newStatus as any,
          changed_by_user_id: userId,
          change_reason: dto.reason,
        },
      });

      return updated;
    });
    
    this.wsGateway.broadcastPotholeStatusChanged({
        potholeId: id,
        oldStatus: currentStatus,
        newStatus: newStatus,
        changedByUserId: userId,
    });
    this.logger.log(`Pothole ${id} status updated to ${newStatus} by user ${userId}`);

    return updatedPothole;
  }
}