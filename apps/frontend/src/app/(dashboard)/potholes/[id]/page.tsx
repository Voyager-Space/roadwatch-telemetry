'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { potholesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@roadwatch/ui-components';
import AiSummaryCard from '@/components/potholes/ai-summary-card';
import { ArrowLeft, MapPin, Calendar, Activity, CheckCircle, Clock, Navigation } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function PotholeDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();

  const { data: pothole, isLoading } = useQuery({
    queryKey: ['pothole', params.id],
    queryFn: () => potholesApi.getById(params.id),
  });

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: (newStatus: string) => potholesApi.updateStatus(params.id, { newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pothole', params.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-potholes'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin mb-4"></div>
          <p className="text-slate-400 font-mono tracking-widest text-sm">DECRYPTING TELEMETRY...</p>
        </div>
      </div>
    );
  }

  if (!pothole) return <div className="text-slate-400">Record not found.</div>;

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto w-full">
      
      {/* Header Panel */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/potholes">
            <Button variant="outline" size="icon" className="glass-card hover:text-white rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-mono">{pothole.potholeCode}</h2>
              <Badge variant={pothole.severityScore >= 7 ? 'destructive' : pothole.severityScore >= 4 ? 'warning' : 'default'} className="shadow-sm">
                Severity {pothole.severityScore.toFixed(1)}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1 flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> {pothole.roadName || 'Unknown Location'}
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="px-4 py-1.5 text-sm uppercase tracking-wider glass-card border-slate-700">
          Status: <span className="text-blue-400 ml-2 font-semibold">{pothole.currentStatus?.replace('_', ' ') || 'Unknown'}</span>
        </Badge>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Raw Data */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6 md:col-span-1">
          <Card className="glass-card border-slate-800/60">
            <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-900/20">
              <CardTitle className="text-sm flex items-center text-slate-200">
                <Activity className="h-4 w-4 mr-2 text-blue-500" /> Sensor Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-800/60 font-mono text-sm">
                <li className="flex justify-between p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-slate-500">Dimensions</span>
                  <span className="text-slate-200">{pothole.lengthCm || '?'} x {pothole.widthCm || '?'} x {pothole.depthCm || '?'} cm</span>
                </li>
                <li className="flex justify-between p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-slate-500">Coordinates</span>
                  <span className="text-slate-200 flex items-center">
                    {pothole.latitude?.toFixed(5)}, {pothole.longitude?.toFixed(5)}
                    <Navigation className="h-3 w-3 ml-2 text-slate-600" />
                  </span>
                </li>
                <li className="flex justify-between p-4 hover:bg-slate-800/30 transition-colors">
                  <span className="text-slate-500">Timestamp</span>
                  <span className="text-slate-200 flex items-center">
                    <Calendar className="h-3 w-3 mr-2 text-slate-600" />
                    {pothole.detectedAt ? format(new Date(pothole.detectedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Maintenance Actions */}
          <Card className="glass-card border-slate-800/60">
            <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-900/20">
              <CardTitle className="text-sm flex items-center text-slate-200">
                <Clock className="h-4 w-4 mr-2 text-emerald-500" /> Operations Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button 
                onClick={() => updateStatus('in_progress')} 
                disabled={isUpdating || pothole.status === 'in_progress' || pothole.status === 'resolved'}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-glow-sm"
              >
                Dispatch Crew (In Progress)
              </Button>
              <Button 
                onClick={() => updateStatus('resolved')} 
                disabled={isUpdating || pothole.status === 'resolved'}
                className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-600/40"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Mark Resolved
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: AI & Imagery */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6 md:col-span-2">
          
          {/* Injecting the glowing Gemini AI Card here */}
          <AiSummaryCard 
            potholeId={pothole.id} 
            initialSummary={pothole.aiSummary ? pothole.aiSummary[0] : undefined} 
          />

          {pothole.imageUrl && (
            <Card className="glass-card border-slate-800/60 overflow-hidden">
              <CardHeader className="border-b border-slate-800/60 pb-4 bg-slate-900/20">
                <CardTitle className="text-sm text-slate-200">Visual Evidence</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <img 
                  src={pothole.imageUrl} 
                  alt={`Pothole ${pothole.potholeCode}`} 
                  className="w-full h-auto object-cover max-h-[400px] opacity-90 hover:opacity-100 transition-opacity" 
                />
              </CardContent>
            </Card>
          )}

        </motion.div>
      </div>
    </div>
  );
}