'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { potholesApi } from '@/lib/api';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { TelemetryChart } from '@/components/dashboard/telemetry-chart';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@roadwatch/ui-components';
import Link from 'next/link';
import { ArrowRight, MapPin, RadioReceiver } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/hooks/use-socket';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleTelemetryUpdate = () => queryClient.invalidateQueries({ queryKey: ['dashboard-potholes'] });
    
    socket.on('POTHOLE_CREATED', handleTelemetryUpdate);
    socket.on('POTHOLE_STATUS_CHANGED', handleTelemetryUpdate);

    return () => {
      socket.off('POTHOLE_CREATED', handleTelemetryUpdate);
      socket.off('POTHOLE_STATUS_CHANGED', handleTelemetryUpdate);
    };
  }, [socket, queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-potholes'],
    queryFn: () => potholesApi.query({ status: ['detected', 'verified', 'assigned', 'in_progress'], pageSize: 10, sortBy: 'detected_at', sortOrder: 'desc' }),
  });

  const potholes = Array.isArray(data) ? data : [];
  const metrics = {
    activePotholes: potholes.length,
    criticalPotholes: potholes.filter(p => p.severityScore >= 7.0).length,
    resolvedThisWeek: 142, 
    avgRepairTimeDays: 4.2, 
  };

  return (
    <div className="flex flex-col space-y-8 max-w-7xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center">
            Platform Overview
            {socket?.connected && (
              <span className="ml-3 flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Live telemetry and maintenance operations.</p>
        </div>
        <Link href="/map">
          <Button className="shadow-glow-sm hover:shadow-glow transition-shadow">
            <MapPin className="mr-2 h-4 w-4" /> Open Live Map
          </Button>
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <KpiCards metrics={metrics} isLoading={isLoading} />
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        <div className="lg:col-span-2 space-y-6">
          <TelemetryChart potholes={potholes} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/60 pb-4">
                <CardTitle>Latest High-Priority Detections</CardTitle>
                <Link href="/potholes" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-center text-sm text-slate-500">Loading telemetry data...</div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {[...potholes].slice(0, 4).map((pothole) => (
                      <div key={pothole.id} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors group">
                        <div className="flex flex-col space-y-1">
                          <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{pothole.potholeCode}</span>
                          <span className="text-xs text-slate-400 flex items-center">
                            <MapPin className="mr-1 h-3 w-3" />
                            {pothole.roadName || 'Unknown Location'} ({pothole.latitude?.toFixed(4)}, {pothole.longitude?.toFixed(4)})
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-end space-y-1">
                            <Badge variant={pothole.severityScore >= 7 ? 'destructive' : pothole.severityScore >= 4 ? 'warning' : 'default'}>
                              Severity: {pothole.severityScore.toFixed(1)}
                            </Badge>
                            <span className="text-xs text-slate-500 font-mono">
                              {pothole.detectedAt ? formatDistanceToNow(new Date(pothole.detectedAt), { addSuffix: true }) : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card h-full">
            <CardHeader className="border-b border-slate-800/60 pb-4">
              <CardTitle className="flex items-center">
                <RadioReceiver className="h-5 w-5 mr-2 text-slate-400" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>WebSocket Link</span>
                    <span className={socket?.connected ? "text-emerald-400" : "text-amber-400"}>
                      {socket?.connected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${socket?.connected ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-1/2 animate-pulse'}`}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>Gemini AI Engine</span>
                    <span className="text-emerald-400">Online</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20 shadow-glow-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors mt-8">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Automated Dispatch</h4>
                  <p className="text-xs text-blue-200/80 leading-relaxed relative z-10">
                    Active routing is currently optimized. High severity detections in Zone Alpha have been automatically prioritized.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}