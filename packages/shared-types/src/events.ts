
import { PotholeStatus } from './enums';

export enum WebSocketEventType {
  // Pothole events
  POTHOLE_CREATED = 'pothole:created',
  POTHOLE_UPDATED = 'pothole:updated',
  POTHOLE_STATUS_CHANGED = 'pothole:status_changed',
  
  // Cluster events
  CLUSTER_UPDATED = 'cluster:updated',
  CLUSTER_CREATED = 'cluster:created',
  
  // Maintenance events
  TASK_ASSIGNED = 'task:assigned',
  TASK_STATUS_CHANGED = 'task:status_changed',
  
  // Analytics & Dashboard events
  HEATMAP_UPDATED = 'heatmap:updated',
  METRICS_UPDATED = 'metrics:updated',
  ALERT_TRIGGERED = 'alert:triggered',
  
  // System events
  CONNECTION_ESTABLISHED = 'connection:established',
  HEARTBEAT = 'heartbeat',
}

export interface PotholeStatusChangedEvent {
  potholeId: string;
  oldStatus: PotholeStatus;
  newStatus: PotholeStatus;
  changedByUserId?: string;
}

export interface AlertTriggeredEvent {
  alertType: 'critical_pothole' | 'cluster_growth' | 'high_risk_zone';
  message: string;
  entityId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}