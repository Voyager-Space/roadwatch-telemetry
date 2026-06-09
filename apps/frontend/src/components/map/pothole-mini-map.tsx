'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface PotholeMiniMapProps {
  latitude: number;
  longitude: number;
  severityScore: number;
}

export default function PotholeMiniMap({ latitude, longitude, severityScore }: PotholeMiniMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-full w-full animate-pulse bg-gray-200"></div>;
  }

  // NOTE: In the next phase, we will replace this div with an actual react-leaflet MapContainer.
  // For now, it serves as the spatial placeholder ensuring the layout works perfectly.
  return (
    <div className="relative h-full w-full bg-[#e5e3df] overflow-hidden flex items-center justify-center">
      {/* Abstract Map Background Pattern */}
      <div 
        className="absolute inset-0 opacity-20" 
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #9ca3af 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg border-4 border-white ${
          severityScore >= 7 ? 'bg-red-500' : severityScore >= 4 ? 'bg-orange-500' : 'bg-green-500'
        }`}>
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <div className="mt-3 bg-white px-3 py-1.5 rounded shadow-sm text-xs font-semibold text-gray-700">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </div>
      </div>
    </div>
  );
}