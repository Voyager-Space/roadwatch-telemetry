import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HeatmapDataDto, HeatmapPointDto, HeatmapZoneDto } from '@roadwatch/shared-types';
import { calculateHeatmapIntensity } from '@roadwatch/shared-utils';

@Injectable()
export class HeatmapService {
  private readonly logger = new Logger(HeatmapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHeatmapData(): Promise<HeatmapDataDto> {
    this.logger.debug('Generating real-time heatmap analytical data...');

    const [activePotholes, zones] = await Promise.all([
      this.fetchActiveHeatmapPoints(),
      this.calculateZoneAnalytics(),
    ]);

    return {
      points: activePotholes,
      zones: zones,
      lastUpdated: new Date(),
    };
  }

  private async fetchActiveHeatmapPoints(): Promise<HeatmapPointDto[]> {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Offload the count and age calculations directly to PostgreSQL
    const points = await this.prisma.$queryRaw<any[]>`
      SELECT 
        latitude as lat, 
        longitude as lng,
        severity_score,
        (SELECT COUNT(*) FROM pothole_events WHERE pothole_id = potholes.id) as event_count,
        EXTRACT(EPOCH FROM (NOW() - detected_at)) * 1000 as age_ms
      FROM potholes
      WHERE is_archived = false
        AND current_status::text IN ('detected', 'verified', 'assigned', 'in_progress', 'needs_recheck')
    `;

    return points.map((p) => {
      // Age factor (0 to 1, where 1 is brand new)
      const recency = Math.max(0, 1 - Number(p.age_ms) / thirtyDaysMs);

      const intensity = calculateHeatmapIntensity({
        severityScore: Number(p.severity_score),
        eventCount: Number(p.event_count),
        recency: recency,
      });

      return {
        lat: Number(p.lat),
        lng: Number(p.lng),
        intensity,
      };
    });
  }

  private async calculateZoneAnalytics(): Promise<HeatmapZoneDto[]> {
    const dbZones = await this.prisma.heatmapZone.findMany();
    
    if (dbZones.length === 0) {
      return this.generateDynamicZones();
    }

    return dbZones.map(zone => ({
      id: zone.id,
      zoneName: zone.zone_name,
      centerLatitude: zone.center_latitude,
      centerLongitude: zone.center_longitude,
      riskLevel: zone.risk_level,
      potholeDensity: zone.pothole_density,
      averageSeverity: zone.average_severity,
      activePotholeCount: zone.active_pothole_count,
      resolvedPotholeCount: zone.resolved_pothole_count,
    }));
  }

  private async generateDynamicZones(): Promise<HeatmapZoneDto[]> {
    const globalStats = await this.prisma.pothole.aggregate({
      where: { is_archived: false },
      _count: { id: true },
      _avg: { severity_score: true, latitude: true, longitude: true },
    });

    const activeStats = await this.prisma.pothole.count({
      where: { 
        is_archived: false, 
        current_status: { notIn: ['completed', 'dismissed'] } 
      }
    });

    const resolvedStats = await this.prisma.pothole.count({
      where: { current_status: 'completed' }
    });

    if (globalStats._count.id === 0) return [];

    return [{
      id: 'dynamic-zone-01',
      zoneName: 'Global Operations Area',
      centerLatitude: globalStats._avg.latitude || 40.7128,
      centerLongitude: globalStats._avg.longitude || -74.0060,
      riskLevel: (globalStats._avg.severity_score || 0) > 7 ? 'critical' : 'medium',
      potholeDensity: 0.5, 
      averageSeverity: globalStats._avg.severity_score || 0,
      activePotholeCount: activeStats,
      resolvedPotholeCount: resolvedStats,
    }];
  }
}