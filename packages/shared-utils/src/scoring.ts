export interface ImpactData {
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

export interface ScoringThresholds {
  severityLowThreshold: number;
  severityMediumThreshold: number;
  severityHighThreshold: number;
  severityCriticalThreshold: number;
}

const DEFAULT_THRESHOLDS: ScoringThresholds = {
  severityLowThreshold: 3.0,
  severityMediumThreshold: 5.0,
  severityHighThreshold: 7.0,
  severityCriticalThreshold: 9.0,
};

/**
 * Calculate impact force from acceleration data
 */
export function calculateImpactForce(data: ImpactData): number {
  // Calculate total acceleration magnitude
  const accelMagnitude = Math.sqrt(
    data.accelerationX ** 2 +
    data.accelerationY ** 2 +
    data.accelerationZ ** 2
  );

  // Calculate gyro magnitude (rotational component)
  const gyroMagnitude = Math.sqrt(
    data.gyroX ** 2 +
    data.gyroY ** 2 +
    data.gyroZ ** 2
  );

  // Normalize gyro to a 0-1 scale (assuming max 2000 deg/s)
  const normalizedGyro = Math.min(gyroMagnitude / 2000, 1);

  // Combine accelerometer and gyroscope data
  // Weight accelerometer more heavily (0.7) than gyro (0.3)
  const impactForce = accelMagnitude * 0.7 + normalizedGyro * 3 * 0.3;

  return Math.min(impactForce, 20); // Cap at 20g
}

/**
 * Calculate severity score (0-10) from impact force
 */
export function calculateSeverityScore(impactForce: number): number {
  // Map impact force to 0-10 scale
  // Typical pothole impact: 2-15g
  const normalizedForce = Math.min(impactForce / 15, 1);
  const severity = normalizedForce * 10;

  return Math.round(severity * 10) / 10; // Round to 1 decimal
}

/**
 * Get severity level from score
 */
export function getSeverityLevel(
  score: number,
  thresholds: ScoringThresholds = DEFAULT_THRESHOLDS
): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= thresholds.severityCriticalThreshold) return 'critical';
  if (score >= thresholds.severityHighThreshold) return 'high';
  if (score >= thresholds.severityMediumThreshold) return 'medium';
  return 'low';
}

/**
 * Calculate confidence score based on various factors
 */
export function calculateConfidenceScore(params: {
  gpsAccuracy?: number;
  speedEstimate?: number;
  impactForce: number;
  eventCount?: number;
}): number {
  let confidence = 0.5; // Base confidence

  // GPS accuracy factor (better accuracy = higher confidence)
  if (params.gpsAccuracy !== undefined) {
    if (params.gpsAccuracy <= 5) confidence += 0.2;
    else if (params.gpsAccuracy <= 10) confidence += 0.15;
    else if (params.gpsAccuracy <= 20) confidence += 0.1;
    else if (params.gpsAccuracy > 50) confidence -= 0.1;
  }

  // Speed factor (moderate speed = higher confidence for pothole detection)
  if (params.speedEstimate !== undefined) {
    if (params.speedEstimate >= 20 && params.speedEstimate <= 60) {
      confidence += 0.15;
    } else if (params.speedEstimate > 100) {
      confidence -= 0.1; // High speed might cause false positives
    } else if (params.speedEstimate < 5) {
      confidence -= 0.1; // Very slow might be other bumps
    }
  }

  // Impact force factor
  if (params.impactForce >= 3 && params.impactForce <= 15) {
    confidence += 0.1; // Typical pothole range
  } else if (params.impactForce > 15) {
    confidence -= 0.05; // Extremely high might be speed bump or accident
  }

  // Event count factor (more detections = higher confidence)
  if (params.eventCount !== undefined && params.eventCount > 1) {
    confidence += Math.min(params.eventCount * 0.05, 0.2);
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate risk score for a pothole
 */
export function calculateRiskScore(params: {
  severityScore: number;
  confidenceScore: number;
  eventCount: number;
  daysSinceDetection: number;
  isOnMainRoad?: boolean;
  trafficVolume?: 'low' | 'medium' | 'high';
}): number {
  let risk = params.severityScore * 0.4; // Base risk from severity

  // Confidence factor
  risk += params.confidenceScore * 2;

  // Age factor (older unresolved potholes are higher risk)
  const ageFactor = Math.min(params.daysSinceDetection / 30, 1) * 1.5;
  risk += ageFactor;

  // Event count factor (frequently detected = higher risk)
  const eventFactor = Math.min(params.eventCount / 10, 1) * 1.5;
  risk += eventFactor;

  // Traffic factors
  if (params.isOnMainRoad) {
    risk += 1;
  }

  if (params.trafficVolume === 'high') {
    risk += 1;
  } else if (params.trafficVolume === 'medium') {
    risk += 0.5;
  }

  return Math.min(10, Math.round(risk * 10) / 10);
}

/**
 * Calculate cluster risk score
 */
export function calculateClusterRiskScore(params: {
  potholeCount: number;
  averageSeverity: number;
  maxSeverity: number;
  areaSquareMeters: number;
}): number {
  // Density factor (potholes per 1000 sq meters)
  const density = (params.potholeCount / params.areaSquareMeters) * 1000;
  const densityFactor = Math.min(density * 2, 3);

  // Severity factors
  const avgSeverityFactor = params.averageSeverity * 0.3;
  const maxSeverityFactor = params.maxSeverity * 0.2;

  // Count factor
  const countFactor = Math.min(params.potholeCount / 5, 2);
  
  const risk = densityFactor + avgSeverityFactor + maxSeverityFactor + countFactor;

  return Math.min(10, Math.round(risk * 10) / 10);
}

/**
 * Calculate priority score for maintenance scheduling
 */
export function calculatePriorityScore(params: {
  severityScore: number;
  riskScore: number;
  daysSinceDetection: number;
  complaintCount?: number;
  isEmergencyRoute?: boolean;
}): number {
  let priority = params.severityScore * 0.3 + params.riskScore * 0.3;
  
  // Age factor
  const ageFactor = Math.min(params.daysSinceDetection / 14, 1) * 2;
  priority += ageFactor;

  // Complaint factor
  if (params.complaintCount) {
    priority += Math.min(params.complaintCount * 0.5, 2);
  }

  // Emergency route factor
  if (params.isEmergencyRoute) {
    priority += 2;
  }

  return Math.min(10, Math.round(priority * 10) / 10);
}

/**
 * Get priority level from score
 */
export function getPriorityLevel(
  score: number
): 'low' | 'medium' | 'high' | 'urgent' | 'critical' {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'urgent';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * Calculate heatmap intensity for a point
 */
export function calculateHeatmapIntensity(params: {
  severityScore: number;
  eventCount: number;
  recency: number; // 0-1, where 1 is most recent
}): number {
  const severityFactor = params.severityScore / 10;
  const eventFactor = Math.min(params.eventCount / 10, 1);
  const recencyFactor = params.recency;
  
  const intensity = (severityFactor * 0.5 + eventFactor * 0.3 + recencyFactor * 0.2);

  return Math.max(0, Math.min(1, intensity));
}