export enum PotholeStatus {
  DETECTED = 'detected',
  VERIFIED = 'verified',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
  NEEDS_RECHECK = 'needs_recheck',
  ARCHIVED = 'archived',
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TECHNICIAN = 'technician',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export enum ExportType {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  ASSIGN = 'assign',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum EntityType {
  POTHOLE = 'pothole',
  MAINTENANCE_TASK = 'maintenance_task',
  USER = 'user',
  CLUSTER = 'cluster',
  EXPORT = 'export',
  SETTINGS = 'settings',
}

export enum RiskLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export enum TransmissionSource {
  RF_GATEWAY = 'rf_gateway',
  CELLULAR = 'cellular',
  WIFI = 'wifi',
  MANUAL = 'manual',
  SIMULATOR = 'simulator',
}