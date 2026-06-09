// Status workflow validation map
export const STATUS_WORKFLOW: Record<string, string[]> = {
  detected: ['verified', 'dismissed'],
  verified: ['assigned', 'dismissed', 'needs_recheck'],
  assigned: ['in_progress', 'needs_recheck'],
  in_progress: ['completed', 'needs_recheck'],
  completed: ['archived', 'needs_recheck'],
  dismissed: ['detected'],
  needs_recheck: ['verified', 'dismissed'],
  archived: [],
};

// Severity thresholds
export const SEVERITY_THRESHOLDS = {
  LOW: 3.0,
  MEDIUM: 5.0,
  HIGH: 7.0,
  CRITICAL: 9.0,
};

// Risk level thresholds
export const RISK_THRESHOLDS = {
  MINIMAL: 2.0,
  LOW: 4.0,
  MODERATE: 6.0,
  HIGH: 8.0,
  SEVERE: 9.0,
  CRITICAL: 9.5,
};

// Map defaults
export const MAP_DEFAULTS = {
  CENTER: { lat: 40.7128, lng: -74.006 }, // Defaulting to NYC for setup
  ZOOM: 12,
  MIN_ZOOM: 4,
  MAX_ZOOM: 19,
};

// Clustering defaults
export const CLUSTERING_DEFAULTS = {
  RADIUS_METERS: 50,
  MIN_POINTS: 2,
  HEATMAP_CELL_SIZE: 100,
};

// API rate limits (requests per TTL window)
export const RATE_LIMITS = {
  DEFAULT: { ttl: 60, limit: 100 },
  AUTH: { ttl: 60, limit: 10 },
  INGEST: { ttl: 1, limit: 100 },
  EXPORT: { ttl: 60, limit: 5 },
};

export const SEVERITY_LEVELS = [
  { key: 'low', label: 'Low', color: '#22c55e', range: [0, 3] },
  { key: 'medium', label: 'Medium', color: '#f59e0b', range: [3, 5] },
  { key: 'high', label: 'High', color: '#f97316', range: [5, 7] },
  { key: 'critical', label: 'Critical', color: '#ef4444', range: [7, 10] },
];