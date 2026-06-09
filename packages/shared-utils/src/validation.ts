import { z } from 'zod';

// Coordinate validation
export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const coordinateSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const boundingBoxSchema = z.object({
  minLat: latitudeSchema,
  maxLat: latitudeSchema,
  minLng: longitudeSchema,
  maxLng: longitudeSchema,
}).refine(
  data => data.minLat < data.maxLat && data.minLng < data.maxLng,
  { message: 'Invalid bounding box coordinates' }
);

// Event ingestion validation
export const ingestEventSchema = z.object({
  deviceId: z.string().min(1).max(100),
  packetUuid: z.string().uuid().optional(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  accelerationX: z.number().min(-20).max(20),
  accelerationY: z.number().min(-20).max(20),
  accelerationZ: z.number().min(-20).max(20),
  gyroX: z.number().min(-2000).max(2000),
  gyroY: z.number().min(-2000).max(2000),
  gyroZ: z.number().min(-2000).max(2000),
  speedEstimate: z.number().min(0).max(300).optional(),
  gpsAccuracy: z.number().min(0).max(100).optional(),
  eventTimestamp: z.coerce.date(),
  transmissionSource: z.enum(['rf_gateway', 'cellular', 'wifi', 'manual', 'simulator']).optional(),
  rawPayload: z.string().optional(),
});

// Auth validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
  fullName: z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

// Pothole validation
export const createPotholeSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  roadName: z.string().max(200).optional(),
  areaName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  severityScore: z.number().min(0).max(10).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const updatePotholeSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  roadName: z.string().max(200).optional(),
  areaName: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  severityScore: z.number().min(0).max(10).optional(),
  currentStatus: z.enum([
    'detected', 'verified', 'assigned', 'in_progress',
    'completed', 'dismissed', 'needs_recheck', 'archived'
  ]).optional(),
  resolutionNotes: z.string().max(5000).optional(),
});

export const potholeFilterSchema = z.object({
  status: z.array(z.enum([
    'detected', 'verified', 'assigned', 'in_progress',
    'completed', 'dismissed', 'needs_recheck', 'archived'
  ])).optional(),
  severityLevel: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  minSeverity: z.number().min(0).max(10).optional(),
  maxSeverity: z.number().min(0).max(10).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  clusterId: z.string().uuid().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  isArchived: z.boolean().optional(),
  boundingBox: boundingBoxSchema.optional(),
  search: z.string().max(200).optional(),
});

// Maintenance task validation
export const createMaintenanceTaskSchema = z.object({
  potholeId: z.string().uuid(),
  assignedUserId: z.string().uuid().optional(),
  priorityLevel: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  taskNotes: z.string().max(5000).optional(),
  scheduledDate: z.coerce.date().optional(),
  estimatedDuration: z.number().min(0).max(480).optional(),
});

export const updateMaintenanceTaskSchema = z.object({
  assignedUserId: z.string().uuid().optional(),
  taskStatus: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
  priorityLevel: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
  taskNotes: z.string().max(5000).optional(),
  scheduledDate: z.coerce.date().optional(),
  verificationNotes: z.string().max(5000).optional(),
  materialsUsed: z.array(z.string()).optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export validation
export const createExportSchema = z.object({
  exportType: z.enum(['csv', 'json', 'pdf']),
  filters: potholeFilterSchema.optional(),
  includeEvents: z.boolean().default(false),
  includeMaintenanceTasks: z.boolean().default(false),
});

// Settings validation
export const updateSettingsSchema = z.object({
  clusterRadiusMeters: z.number().min(10).max(1000).optional(),
  minClusterPoints: z.number().min(1).max(100).optional(),
  heatmapCellSizeMeters: z.number().min(50).max(1000).optional(),
  severityLowThreshold: z.number().min(0).max(10).optional(),
  severityMediumThreshold: z.number().min(0).max(10).optional(),
  severityHighThreshold: z.number().min(0).max(10).optional(),
  severityCriticalThreshold: z.number().min(0).max(10).optional(),
  aiEnabled: z.boolean().optional(),
  aiCacheDurationMinutes: z.number().min(1).max(10080).optional(),
  autoClusteringEnabled: z.boolean().optional(),
  autoAssignmentEnabled: z.boolean().optional(),
});

// Validate helper
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T;
  errors?: z.ZodError 
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}