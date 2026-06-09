'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { Card, CardContent, Button, Badge } from '@roadwatch/ui-components';
import { Cpu, AlertTriangle, Wrench, RefreshCw, Terminal, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AiSummaryCard({ potholeId }: { potholeId: string }) {
  const queryClient = useQueryClient();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { data: aiData, isLoading, error } = useQuery({
    queryKey: ['ai-summary', potholeId],
    queryFn: () => aiApi.generateSummary(potholeId),
    retry: 1,
  });

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Force cache invalidation to trigger a new fetch
      await queryClient.invalidateQueries({ queryKey: ['ai-summary', potholeId] });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading || isRegenerating) {
    return (
      <Card className="glass-card bg-slate-950/80 border-blue-500/30 shadow-glow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-blue-400">
          <Cpu className="h-10 w-10 animate-bounce mb-4" />
          <div className="font-mono text-sm tracking-[0.2em] uppercase">Initializing Neural Analysis...</div>
          <div className="w-48 h-1 bg-slate-800 mt-4 rounded overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card bg-slate-950/80 border-red-500/30">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-red-400 font-mono font-bold mb-1">AI SUBSYSTEM OFFLINE</h3>
          <p className="text-xs text-slate-400 mb-4">Verify GEMINI_API_KEY in backend environment variables. Key must begin with 'AIza'.</p>
          <Button variant="outline" size="sm" onClick={handleRegenerate} className="border-red-500/50 hover:bg-red-500/10 text-red-400">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!aiData) return null;

  return (
    <Card className="glass-card bg-slate-950/80 border-slate-800/80 relative overflow-hidden group">
      {/* Subtle background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="border-b border-slate-800/60 bg-slate-900/50 px-5 py-3 flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-blue-400" />
          <h3 className="font-mono text-sm font-bold text-slate-200 tracking-wider">GEMINI_1.5_FLASH</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRegenerate} className="h-7 w-7 text-slate-400 hover:text-blue-400">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      <CardContent className="p-0 relative z-10">
        <div className="divide-y divide-slate-800/50">
          <div className="p-5 hover:bg-slate-800/20 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <Terminal className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-mono text-slate-400 uppercase">Executive Summary</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{aiData.summaryText}</p>
          </div>

          <div className="p-5 hover:bg-slate-800/20 transition-colors bg-red-950/10">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs font-mono text-red-400/80 uppercase">Risk Assessment</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{aiData.maintenanceNote}</p>
          </div>

          <div className="p-5 hover:bg-slate-800/20 transition-colors bg-blue-950/10">
            <div className="flex items-center space-x-2 mb-2">
              <Wrench className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-mono text-blue-400/80 uppercase">Tactical Resolution</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{aiData.repairRecommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}