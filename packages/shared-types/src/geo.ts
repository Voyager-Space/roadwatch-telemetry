export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoBoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface MapMarker {
  id: string;
  position: GeoPoint;
  title?: string;
  severity?: string;
  status?: string;
  potholeCode?: string;
}

export interface ClusterPoint {
  id: string;
  lat: number;
  lng: number;
  weight?: number;
  properties?: Record<string, any>;
}

export interface HeatmapConfig {
  radius: number;
  blur: number;
  maxZoom: number;
  minOpacity: number;
  gradient?: Record<number, string>;
}