'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@roadwatch/ui-components';
import { AlertTriangle, Activity, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface KpiCardsProps {
  metrics: {
    activePotholes: number;
    criticalPotholes: number;
    resolvedThisWeek: number;
    avgRepairTimeDays: number;
  };
  isLoading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export function KpiCards({ metrics, isLoading }: KpiCardsProps) {
  const kpis = [
    {
      title: 'Active Backlog',
      value: metrics.activePotholes.toString(),
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border border-amber-500/20',
      glow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]'
    },
    {
      title: 'Critical Severity',
      value: metrics.criticalPotholes.toString(),
      icon: Activity,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
      glow: 'hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]'
    },
    {
      title: 'Resolved (7 Days)',
      value: metrics.resolvedThisWeek.toString(),
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border border-emerald-500/20',
      glow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.15)]'
    },
    {
      title: 'Avg Repair Time',
      value: `${metrics.avgRepairTimeDays} days`,
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border border-blue-500/20',
      glow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.15)]'
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse glass-card border-slate-800/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 rounded bg-slate-800/80"></div>
              <div className="h-8 w-8 rounded-full bg-slate-800/80"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-slate-800/80 mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <motion.div key={index} variants={itemVariants}>
            <Card className={`group h-full glass-card border-slate-800/60 transition-all duration-300 hover:-translate-y-1 ${kpi.glow}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {kpi.title}
                </CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${kpi.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100 font-mono tracking-tight mt-1">
                  {kpi.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}