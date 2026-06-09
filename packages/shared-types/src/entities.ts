import {
  PotholeStatus,
  PriorityLevel,
  UserRole,
} from './enums';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  fullName: string;
  email: string;
  roleId: string;
  role?: Role;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
}

export interface Role extends BaseEntity {
  name: UserRole;
  description?: string | null;
  permissionsJson: Record<string, any>;
}

export interface Pothole extends BaseEntity {
  potholeCode: string;
  clusterId?: string | null;
  cluster?: PotholeCluster;
  title: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  roadName?: string | null;
  areaName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  severityScore: number;
  confidenceScore: number;
  riskScore: number;
  currentStatus: PotholeStatus;
  detectedAt: Date;
  verifiedAt?: Date | null;
  assignedAt?: Date | null;
  resolvedAt?: Date | null;
  archivedAt?: Date | null;
  isArchived: boolean;
  resolutionNotes?: string | null;
  aiSummaryId?: string | null;
  aiSummary?: AISummary;
  events?: PotholeEvent[];
  statusHistory?: PotholeStatusHistory[];
  maintenanceTasks?: MaintenanceTask[];
}

export interface PotholeEvent extends Partial<BaseEntity> {
  id: string;
  potholeId?: string | null;
  pothole?: Pothole;
  deviceId: string;
  rawPacketId: string;
  rawPacket?: RawPacket;
  latitude: number;
  longitude: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  impactForce: number;
  speedEstimate?: number | null;
  gpsAccuracy?: number | null;
  confidenceScore: number;
  eventTimestamp: Date;
  createdAt: Date;
}

export interface RawPacket {
  id: string;
  packetUuid: string;
  rawPayload: Record<string, any>;
  checksumValid: boolean;
  transmissionSource: string;
  receivedAt: Date;
  decodedSuccessfully: boolean;
  parserVersion: string;
  event?: PotholeEvent;
}

export interface PotholeCluster extends BaseEntity {
  clusterName: string;
  centroidLatitude: number;
  centroidLongitude: number;
  potholeCount: number;
  averageSeverity: number;
  clusterRiskScore: number;
  potholes?: Pothole[];
}

export interface MaintenanceTask extends BaseEntity {
  potholeId: string;
  pothole?: Pothole;
  assignedUserId?: string | null;
  assignedUser?: User;
  taskStatus: PotholeStatus;
  priorityLevel: PriorityLevel;
  taskNotes?: string | null;
  scheduledDate?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  verificationNotes?: string | null;
}

export interface PotholeStatusHistory {
  id: string;
  potholeId: string;
  pothole?: Pothole;
  oldStatus: PotholeStatus;
  newStatus: PotholeStatus;
  changedByUserId: string;
  changedByUser?: User;
  changeReason?: string | null;
  changedAt: Date;
}

export interface AISummary {
  id: string;
  potholeId: string;
  pothole?: Pothole;
  summaryText: string;
  maintenanceNote?: string | null;
  repairRecommendation?: string | null;
  generatedModel: string;
  generatedAt: Date;
  cachedUntil?: Date | null;
}

export interface HeatmapZone {
  id: string;
  zoneName: string;
  centerLatitude: number;
  centerLongitude: number;
  riskLevel: PriorityLevel;
  potholeDensity: number;
  averageSeverity: number;
  activePotholeCount: number;
  resolvedPotholeCount: number;
  lastUpdated: Date;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: User;
  actionType: string;
  entityType: string;
  entityId: string;
  previousData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  createdAt: Date;
}

export interface Export {
  id: string;
  exportType: string;
  generatedByUserId: string;
  user?: User;
  fileUrl: string;
  createdAt: Date;
}