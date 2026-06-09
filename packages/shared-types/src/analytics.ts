import { SeverityLevel, PotholeStatus, RiskLevel } from './enums';

export interface DashboardMetrics {
  totalPotholes: number;
  activePotholes: number;
  resolvedPotholes: number;
  archivedPotholes: number;
  criticalPotholes: number;
  highPriorityPotholes: number;
  averageSeverity: number;
  averageConfidence: number;
  totalClusters: number;
  pendingTasks: number;
  detectedToday: number;
  resolvedToday: number;
  averageResolutionTime: number;
}

export interface SeverityDistribution {
  level: SeverityLevel;
  count: number;
  percentage: number;
}

export interface StatusDistribution {
  status: PotholeStatus;
  count: number;
  percentage: number;
}

export interface TrendData {
  period: string;
  detected: number;
  resolved: number;
  pending: number;
}

export interface ZoneRiskData {
  zoneId: string;
  zoneName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  potholeCount: number;
  averageSeverity: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}