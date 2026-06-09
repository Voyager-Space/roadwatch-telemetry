import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestEventDto, PotholeStatus } from '@roadwatch/shared-types';
import { randomUUID } from 'crypto';
import {
  calculateImpactForce,
  calculateSeverityScore,
  calculateConfidenceScore,
  getSeverityLevel,
  CLUSTERING_DEFAULTS,
} from '@roadwatch/shared-utils';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
// FIX: Removed the unused `import { Prisma } from '@prisma/client';`

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: AppWebSocketGateway  
  ) {}

  async processRawEvent(dto: IngestEventDto) {
    const packetUuid = dto.packetUuid || randomUUID();

    const impactData = {
      accelerationX: dto.accelerationX,
      accelerationY: dto.accelerationY,
      accelerationZ: dto.accelerationZ,
      gyroX: dto.gyroX,
      gyroY: dto.gyroY,
      gyroZ: dto.gyroZ,
    };
    
    const impactForce = calculateImpactForce(impactData);
    const severityScore = calculateSeverityScore(impactForce);
    
    const confidenceScore = calculateConfidenceScore({
      impactForce,
      gpsAccuracy: dto.gpsAccuracy,
      speedEstimate: dto.speedEstimate,
      eventCount: 1,
    });

    const rawPacket = await this.prisma.rawPacket.create({
      data: {
        packet_uuid: packetUuid,
        raw_payload: dto as any,
        checksum_valid: true,
        transmission_source: dto.transmissionSource || 'rf_gateway',
        decoded_successfully: true,
        parser_version: '1.0.0',
      },
    });

    if (impactForce < 2.0) {
      this.logger.debug(`Impact force ${impactForce.toFixed(2)} too low, ignoring event.`);
      return { status: 'ignored', reason: 'impact_below_threshold' };
    }

    const radius = CLUSTERING_DEFAULTS.RADIUS_METERS;
    
    const potentialMatches = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        pothole_code, 
        latitude, 
        longitude, 
        severity_score, 
        (SELECT COUNT(*) FROM pothole_events WHERE pothole_id = potholes.id) as event_count
      FROM potholes
      WHERE is_archived = false
        AND current_status::text NOT IN ('completed', 'dismissed')
        AND ST_DWithin(
              ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography,
              ${radius}
            )
      ORDER BY ST_Distance(
                 ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
                 ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)::geography
               ) ASC
      LIMIT 1;
    `;

    const matchedPothole = potentialMatches[0];
    let targetPotholeId: string;

    if (matchedPothole) {
      targetPotholeId = matchedPothole.id;
      
      const newEventCount = Number(matchedPothole.event_count) + 1;
      const newConfidence = calculateConfidenceScore({
        impactForce,
        gpsAccuracy: dto.gpsAccuracy,
        speedEstimate: dto.speedEstimate,
        eventCount: newEventCount,
      });
      
      const newSeverity = Math.max(matchedPothole.severity_score, severityScore);

      await this.prisma.pothole.update({
        where: { id: matchedPothole.id },
        data: {
          severity_score: newSeverity,
          confidence_score: newConfidence,
          updated_at: new Date(),
          latitude: (matchedPothole.latitude * Number(matchedPothole.event_count) + dto.latitude) / newEventCount,
          longitude: (matchedPothole.longitude * Number(matchedPothole.event_count) + dto.longitude) / newEventCount,
        },
      });

      this.logger.log(`Merged event into existing pothole: ${matchedPothole.pothole_code}`);
    } else {
      const year = new Date().getFullYear();
      const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
      const potholeCode = `PH-${year}-${randomChars}`;

      const newPothole = await this.prisma.pothole.create({
        data: {
          pothole_code: potholeCode,
          title: `Detected Pothole - ${potholeCode}`,
          latitude: dto.latitude,
          longitude: dto.longitude,
          severity_score: severityScore,
          confidence_score: confidenceScore,
          current_status: PotholeStatus.DETECTED,
        },
      });
      
      targetPotholeId = newPothole.id;
      this.logger.log(`Created new pothole: ${potholeCode}`);
      
      this.wsGateway.broadcastPotholeCreated({
        id: targetPotholeId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        severity: getSeverityLevel(severityScore),
        status: PotholeStatus.DETECTED,
      });

      if (severityScore >= 9.0) {
        this.wsGateway.broadcastAlert('critical_pothole', `Critical pothole detected by device ${dto.deviceId}!`, 'critical');
      }
    }

    const event = await this.prisma.potholeEvent.create({
      data: {
        pothole_id: targetPotholeId,
        device_id: dto.deviceId,
        raw_packet_id: rawPacket.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        acceleration_x: dto.accelerationX,
        acceleration_y: dto.accelerationY,
        acceleration_z: dto.accelerationZ,
        gyro_x: dto.gyroX,
        gyro_y: dto.gyroY,
        gyro_z: dto.gyroZ,
        impact_force: impactForce,
        speed_estimate: dto.speedEstimate,
        gps_accuracy: dto.gpsAccuracy,
        confidence_score: confidenceScore,
        event_timestamp: new Date(dto.eventTimestamp),
      },
    });

    return {
      status: matchedPothole ? 'merged' : 'created',
      potholeId: targetPotholeId,
      eventId: event.id,
      impactForce,
    };
  }
}