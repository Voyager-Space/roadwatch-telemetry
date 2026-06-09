export interface Point {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Earth radius in meters
const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate the Haversine distance between two points in meters
 */
export function haversineDistance(point1: Point, point2: Point): number {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLatRad = toRadians(point2.lat - point1.lat);
  const deltaLngRad = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate the centroid of an array of points
 */
export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) {
    throw new Error('Cannot calculate centroid of empty array');
  }

  if (points.length === 1) {
    return { lat: points[0].lat, lng: points[0].lng };
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const point of points) {
    const latRad = toRadians(point.lat);
    const lngRad = toRadians(point.lng);

    x += Math.cos(latRad) * Math.cos(lngRad);
    y += Math.cos(latRad) * Math.sin(lngRad);
    z += Math.sin(latRad);
  }

  const total = points.length;
  x /= total;
  y /= total;
  z /= total;

  const centralLng = Math.atan2(y, x);
  const centralSquareRoot = Math.sqrt(x * x + y * y);
  const centralLat = Math.atan2(z, centralSquareRoot);

  return {
    lat: toDegrees(centralLat),
    lng: toDegrees(centralLng),
  };
}

/**
 * Calculate bounding box from an array of points
 */
export function calculateBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) {
    throw new Error('Cannot calculate bounding box of empty array');
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBoundingBox(point: Point, bbox: BoundingBox): boolean {
  return (
    point.lat >= bbox.minLat &&
    point.lat <= bbox.maxLat &&
    point.lng >= bbox.minLng &&
    point.lng <= bbox.maxLng
  );
}

/**
 * Check if a point is within a circle defined by center and radius (in meters)
 */
export function isPointInCircle(point: Point, center: Point, radiusMeters: number): boolean {
  return haversineDistance(point, center) <= radiusMeters;
}

/**
 * Calculate a bounding box around a center point with a given radius in meters
 */
export function calculateBoundingBoxFromCenter(center: Point, radiusMeters: number): BoundingBox {
  const latOffset = toDegrees(radiusMeters / EARTH_RADIUS_METERS);
  const lngOffset = toDegrees(radiusMeters / (EARTH_RADIUS_METERS * Math.cos(toRadians(center.lat))));

  return {
    minLat: center.lat - latOffset,
    maxLat: center.lat + latOffset,
    minLng: center.lng - lngOffset,
    maxLng: center.lng + lngOffset,
  };
}

/**
 * Simple DBSCAN clustering algorithm
 */
export interface ClusterResult<T extends Point> {
  clusterId: number;
  points: T[];
  centroid: Point;
}

export function dbscanClustering<T extends Point>(
  points: T[],
  radiusMeters: number,
  minPoints: number
): ClusterResult<T>[] {
  const visited = new Set<number>();
  const clustered = new Set<number>();
  const clusters: ClusterResult<T>[] = [];
  let currentClusterId = 0;

  const getNeighbors = (pointIndex: number): number[] => {
    const neighbors: number[] = [];
    const point = points[pointIndex];

    for (let i = 0; i < points.length; i++) {
      if (i !== pointIndex && haversineDistance(point, points[i]) <= radiusMeters) {
        neighbors.push(i);
      }
    }

    return neighbors;
  };

  const expandCluster = (
    pointIndex: number,
    neighbors: number[],
    cluster: T[]
  ): void => {
    cluster.push(points[pointIndex]);
    clustered.add(pointIndex);

    let i = 0;
    while (i < neighbors.length) {
      const neighborIndex = neighbors[i];

      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        const newNeighbors = getNeighbors(neighborIndex);

        if (newNeighbors.length >= minPoints) {
          neighbors.push(...newNeighbors.filter(n => !neighbors.includes(n)));
        }
      }

      if (!clustered.has(neighborIndex)) {
        cluster.push(points[neighborIndex]);
        clustered.add(neighborIndex);
      }

      i++;
    }
  };

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    visited.add(i);
    const neighbors = getNeighbors(i);

    if (neighbors.length >= minPoints) {
      const cluster: T[] = [];
      expandCluster(i, neighbors, cluster);

      clusters.push({
        clusterId: currentClusterId++,
        points: cluster,
        centroid: calculateCentroid(cluster),
      });
    }
  }

  return clusters;
}

/**
 * Grid-based spatial hashing for efficient nearby point lookup
 */
export class SpatialHash<T extends Point> {
  private grid: Map<string, T[]> = new Map();
  private cellSizeMeters: number;

  constructor(cellSizeMeters: number) {
    this.cellSizeMeters = cellSizeMeters;
  }

  private getCellKey(lat: number, lng: number): string {
    const cellLat = Math.floor(lat / (this.cellSizeMeters / 111000));
    const cellLng = Math.floor(lng / (this.cellSizeMeters / (111000 * Math.cos(toRadians(lat)))));
    return `${cellLat}:${cellLng}`;
  }

  insert(point: T): void {
    const key = this.getCellKey(point.lat, point.lng);
    const cell = this.grid.get(key) || [];
    cell.push(point);
    this.grid.set(key, cell);
  }

  insertMany(points: T[]): void {
    for (const point of points) {
      this.insert(point);
    }
  }

  getNearbyPoints(center: Point, radiusMeters: number): T[] {
    const bbox = calculateBoundingBoxFromCenter(center, radiusMeters);
    const result: T[] = [];

    // Get all cells that could contain points within radius
    const minKey = this.getCellKey(bbox.minLat, bbox.minLng);
    const maxKey = this.getCellKey(bbox.maxLat, bbox.maxLng);
    
    const [minCellLat, minCellLng] = minKey.split(':').map(Number);
    const [maxCellLat, maxCellLng] = maxKey.split(':').map(Number);

    for (let cellLat = minCellLat; cellLat <= maxCellLat; cellLat++) {
      for (let cellLng = minCellLng; cellLng <= maxCellLng; cellLng++) {
        const key = `${cellLat}:${cellLng}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const point of cell) {
            if (haversineDistance(center, point) <= radiusMeters) {
              result.push(point);
            }
          }
        }
      }
    }

    return result;
  }

  clear(): void {
    this.grid.clear();
  }
}

/**
 * Generate a geohash for a point (simplified version)
 */
export function generateGeohash(lat: number, lng: number, precision: number = 8): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let hash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (hash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      hash += base32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}