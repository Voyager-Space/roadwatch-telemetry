import {
  PotholeStatus,
  SeverityLevel,
  TaskStatus,
  PriorityLevel,
  UserRole,
  ExportType,
  TransmissionSource,
} from './enums';

// ==========================================
// Auth & User DTOs
// ==========================================
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

// ==========================================
// Pothole DTOs
// ==========================================
export interface CreatePotholeDto {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  roadName?: string;
  areaName?: string;
  city?: string;
  state?: string;
  country?: string;
  severityScore?: number;
  confidenceScore?: number;
}

export interface UpdatePotholeDto {
  title?: string;
  description?: string;
  roadName?: string;
  areaName?: string;
  city?: string;
  state?: string;
  country?: string;
  severityScore?: number;
  currentStatus?: PotholeStatus;
  resolutionNotes?: string;
}

export interface BoundingBoxDto {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface PotholeFilterDto {
  status?: PotholeStatus[];
  severityLevel?: SeverityLevel[];
  minSeverity?: number;
  maxSeverity?: number;
  minConfidence?: number;
  clusterId?: string;
  city?: string;
  state?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  isArchived?: boolean;
  boundingBox?: BoundingBoxDto;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PotholeListDto {
  id: string;
  potholeCode: string;
  title: string;
  latitude: number;
  longitude: number;
  roadName?: string;
  city?: string;
  severityScore: number;
  severityLevel: SeverityLevel;
  confidenceScore: number;
  riskScore: number;
  currentStatus: PotholeStatus;
  detectedAt: Date;
  eventCount: number;
}

export interface PotholeDetailDto extends PotholeListDto {
  description?: string;
  areaName?: string;
  state?: string;
  country?: string;
  verifiedAt?: Date;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  events: PotholeEventDto[];
  statusHistory: StatusHistoryDto[];
  maintenanceTasks: MaintenanceTaskDto[];
  aiSummary?: AISummaryDto;
  cluster?: ClusterSummaryDto;
}

// ==========================================
// Event DTOs
// ==========================================
export interface IngestEventDto {
  deviceId: string;
  packetUuid?: string;
  latitude: number;
  longitude: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  speedEstimate?: number;
  gpsAccuracy?: number;
  eventTimestamp: Date | string;
  transmissionSource?: TransmissionSource;
  rawPayload?: string;
}

export interface PotholeEventDto {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  impactForce: number;
  speedEstimate?: number;
  confidenceScore: number;
  eventTimestamp: Date;
}

// ==========================================
// Maintenance Task DTOs
// ==========================================
export interface CreateMaintenanceTaskDto {
  potholeId: string;
  assignedUserId?: string;
  priorityLevel: PriorityLevel;
  taskNotes?: string;
  scheduledDate?: Date;
  estimatedDuration?: number;
}

export interface UpdateMaintenanceTaskDto {
  assignedUserId?: string;
  taskStatus?: TaskStatus;
  priorityLevel?: PriorityLevel;
  taskNotes?: string;
  scheduledDate?: Date;
  verificationNotes?: string;
  materialsUsed?: string[];
}

export interface MaintenanceTaskDto {
  id: string;
  potholeId: string;
  pothole?: PotholeListDto;
  assignedUser?: UserDto;
  taskStatus: TaskStatus;
  priorityLevel: PriorityLevel;
  taskNotes?: string;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  verificationNotes?: string;
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface MaintenanceTaskFilterDto {
  status?: TaskStatus[];
  priority?: PriorityLevel[];
  assignedUserId?: string;
  unassigned?: boolean;
  scheduledFrom?: Date;
  scheduledTo?: Date;
}

// ==========================================
// Status History DTOs
// ==========================================
export interface StatusHistoryDto {
  id: string;
  oldStatus: PotholeStatus;
  newStatus: PotholeStatus;
  changedByUser?: UserDto;
  changeReason?: string;
  changedAt: Date;
}

export interface ChangeStatusDto {
  newStatus: PotholeStatus;
  reason?: string;
}

// ==========================================
// Cluster DTOs
// ==========================================
export interface ClusterSummaryDto {
  id: string;
  clusterName: string;
  centroidLatitude: number;
  centroidLongitude: number;
  potholeCount: number;
  averageSeverity: number;
  clusterRiskScore: number;
}

export interface ClusterDetailDto extends ClusterSummaryDto {
  boundingBox: BoundingBoxDto;
  potholes: PotholeListDto[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// AI Summary DTOs
// ==========================================
export interface AISummaryDto {
  id: string;
  summaryText: string;
  maintenanceNote?: string;
  repairRecommendation?: string;
  estimatedRepairCost?: number;
  estimatedRepairTime?: number;
  generatedAt: Date;
}

export interface GenerateAISummaryDto {
  potholeId: string;
  forceRegenerate?: boolean;
}

// ==========================================
// Heatmap DTOs
// ==========================================
export interface HeatmapZoneDto {
  id: string;
  zoneName: string;
  centerLatitude: number;
  centerLongitude: number;
  riskLevel: string;
  potholeDensity: number;
  averageSeverity: number;
  activePotholeCount: number;
  resolvedPotholeCount: number;
}

export interface HeatmapPointDto {
  lat: number;
  lng: number;
  intensity: number;
}

export interface HeatmapDataDto {
  zones: HeatmapZoneDto[];
  points: HeatmapPointDto[];
  lastUpdated: Date;
}

// ==========================================
// Export DTOs
// ==========================================
export interface CreateExportDto {
  exportType: ExportType;
  filters?: PotholeFilterDto;
  includeEvents?: boolean;
  includeMaintenanceTasks?: boolean;
}

export interface ExportDto {
  id: string;
  exportType: ExportType;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  recordCount?: number;
  createdAt: Date;
  expiresAt?: Date;
}

// ==========================================
// Settings DTOs
// ==========================================
export interface SystemSettingsDto {
  clusterRadiusMeters: number;
  minClusterPoints: number;
  heatmapCellSizeMeters: number;
  severityLowThreshold: number;
  severityMediumThreshold: number;
  severityHighThreshold: number;
  severityCriticalThreshold: number;
  aiEnabled: boolean;
  aiCacheDurationMinutes: number;
  autoClusteringEnabled: boolean;
  autoAssignmentEnabled: boolean;
}

export interface UpdateSettingsDto {
  clusterRadiusMeters?: number;
  minClusterPoints?: number;
  heatmapCellSizeMeters?: number;
  severityLowThreshold?: number;
  severityMediumThreshold?: number;
  severityHighThreshold?: number;
  severityCriticalThreshold?: number;
  aiEnabled?: boolean;
  aiCacheDurationMinutes?: number;
  autoClusteringEnabled?: boolean;
  autoAssignmentEnabled?: boolean;
}