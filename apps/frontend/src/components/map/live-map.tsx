'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import { Button, Badge } from '@roadwatch/ui-components';
import { Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  potholeCode: string;
}

interface LiveMapProps {
  markers: MapMarker[];
  centerLat?: number;
  centerLng?: number;
}

const SEVERITY_COLORS = {
  low: '#22c55e',      // Green
  medium: '#f59e0b',   // Orange
  high: '#ef4444',     // Red
  critical: '#7f1d1d', // Dark Red
};

export default function LiveMap({ markers, centerLat = 12.9063, centerLng = 77.5857 }: LiveMapProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full animate-pulse bg-slate-900/50 flex flex-col items-center justify-center text-slate-500">
        <div className="h-8 w-8 rounded-full border-b-2 border-blue-500 animate-spin mb-4"></div>
        <span className="font-mono text-sm tracking-widest">INITIALIZING GIS ENGINE...</span>
      </div>
    );
  }

  return (
    <MapContainer 
      center={[centerLat, centerLng]} 
      zoom={13} 
      className="h-full w-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
      />
      <ZoomControl position="bottomright" />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.position.lat, marker.position.lng]}
          radius={marker.severity === 'critical' ? 12 : marker.severity === 'high' ? 10 : 8}
          pathOptions={{
            color: SEVERITY_COLORS[marker.severity],
            fillColor: SEVERITY_COLORS[marker.severity],
            fillOpacity: 0.7,
            weight: 2,
          }}
        >
          <Popup className="rounded-lg shadow-sm">
            <div className="flex flex-col space-y-2 p-1 min-w-[150px]">
              <div className="font-bold text-gray-900 border-b pb-1">{marker.potholeCode}</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Severity:</span>
                <Badge variant={marker.severity === 'critical' || marker.severity === 'high' ? 'destructive' : 'warning'} className="text-[10px] px-1 py-0">
                  {marker.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium capitalize">{marker.status.replace('_', ' ')}</span>
              </div>
              <Button 
                size="sm" 
                className="w-full mt-2 h-7 text-xs" 
                onClick={() => router.push(`/potholes/${marker.id}`)}
              >
                View Details <Navigation className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}