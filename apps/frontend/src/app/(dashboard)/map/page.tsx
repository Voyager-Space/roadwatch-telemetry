'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { potholesApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import { Badge, Button } from '@roadwatch/ui-components';
import { Crosshair, Activity, ShieldAlert, Navigation, Layers, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

// Prevent SSR crashing for Leaflet, add a slick boot-up sequence
const LiveMap = dynamic(() => import('@/components/map/live-map'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center">
      <Cpu className="h-12 w-12 text-blue-500 animate-pulse mb-6" />
      <div className="font-mono text-sm tracking-[0.3em] text-blue-400">ESTABLISHING SAT-LINK...</div>
      <div className="w-64 h-1 bg-slate-800 mt-4 overflow-hidden rounded-full">
        <motion.div className="h-full bg-blue-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5 }} />
      </div>
    </div>
  )
});

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { data: markers = [], isLoading } = useQuery({
    queryKey: ['map-markers'],
    queryFn: () => potholesApi.getMapMarkers(),
    refetchInterval: 15000, // Auto-refresh the map every 15 seconds
  });

  // Client-side visual filtering
  const filteredMarkers = markers.filter((m: any) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return m.severity === 'critical' || m.severity === 'high';
    if (activeFilter === 'active') return m.status !== 'completed' && m.status !== 'dismissed';
    return true;
  });

  const criticalCount = markers.filter((m: any) => m.severity === 'critical').length;

  return (
    <div className="relative h-[calc(100vh-6rem)] w-full overflow-hidden rounded-2xl border border-slate-800/60 shadow-glow-sm bg-slate-950">
      
      {/* 1. Base Layer: The Interactive Map */}
      <div className="absolute inset-0 z-0">
        <LiveMap markers={filteredMarkers} />
      </div>

      {/* 2. Floating Overlay: Tactical Sidebar (Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-10 w-80 flex flex-col gap-4 pointer-events-none"
      >
        {/* Main HUD */}
        <div className="glass-card bg-slate-950/80 border-slate-800/80 backdrop-blur-xl p-5 rounded-xl shadow-2xl pointer-events-auto">
          <div className="flex items-center space-x-3 mb-4 border-b border-slate-800/60 pb-4">
            <Crosshair className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-100 font-mono">LIVE_GRID</h2>
              <p className="text-xs text-slate-400 font-mono">Geo-Spatial Telemetry</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/50">
              <div className="text-xs text-slate-500 font-mono mb-1">TOTAL ANOMALIES</div>
              <div className="text-2xl font-bold text-slate-200">{markers.length}</div>
            </div>
            <div className="bg-red-950/20 rounded-lg p-3 border border-red-900/30">
              <div className="text-xs text-red-500/70 font-mono mb-1">CRITICAL RISK</div>
              <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-500 uppercase mb-2">Display Filters</div>
            <Button 
              variant={activeFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              className={`w-full justify-start font-mono text-xs ${activeFilter === 'all' ? 'bg-blue-600 hover:bg-blue-500' : 'border-slate-700 text-slate-300'}`}
              onClick={() => setActiveFilter('all')}
            >
              <Layers className="h-3 w-3 mr-2" /> SHOW ALL DATA
            </Button>
            <Button 
              variant={activeFilter === 'critical' ? 'destructive' : 'outline'} 
              size="sm" 
              className={`w-full justify-start font-mono text-xs ${activeFilter === 'critical' ? '' : 'border-slate-700 text-slate-300'}`}
              onClick={() => setActiveFilter('critical')}
            >
              <ShieldAlert className="h-3 w-3 mr-2" /> CRITICAL ONLY
            </Button>
            <Button 
              variant={activeFilter === 'active' ? 'secondary' : 'outline'} 
              size="sm" 
              className={`w-full justify-start font-mono text-xs ${activeFilter === 'active' ? 'bg-slate-800 text-white' : 'border-slate-700 text-slate-300'}`}
              onClick={() => setActiveFilter('active')}
            >
              <Activity className="h-3 w-3 mr-2" /> UNRESOLVED ONLY
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 3. Floating Overlay: System Status (Bottom Right) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 right-6 z-10 pointer-events-none"
      >
        <div className="glass-card bg-slate-950/90 border-slate-800/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-2xl pointer-events-auto flex items-center space-x-3">
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <span className="font-mono text-xs text-slate-300 tracking-wider">DB_SYNC_ACTIVE</span>
          <div className="h-4 w-px bg-slate-700 mx-2"></div>
          <Badge variant="outline" className="text-[10px] bg-blue-950/30 text-blue-400 border-blue-900/50">
            {filteredMarkers.length} NODES RENDERED
          </Badge>
        </div>
      </motion.div>

    </div>
  );
}