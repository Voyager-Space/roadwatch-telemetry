'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { potholesApi } from '@/lib/api';
import { Card, CardContent, Badge, Button, Input } from '@roadwatch/ui-components';
import Link from 'next/link';
import { Search, MapPin, AlertTriangle, ArrowRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// Custom hook to debounce rapid typing so we don't spam the API
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function PotholesPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500); // Wait 500ms after typing stops

  const { data, isLoading } = useQuery({
    // React Query will automatically refetch when debouncedSearch changes
    queryKey: ['potholes-list', debouncedSearch], 
    queryFn: () => potholesApi.query({ 
      pageSize: 50, 
      sortBy: 'detected_at', 
      sortOrder: 'desc',
      search: debouncedSearch || undefined // Send to backend!
    }),
  });

  const potholes = Array.isArray(data) ? data : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col space-y-8 max-w-7xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Detection Backlog</h2>
          <p className="text-sm text-slate-400 mt-1">Review, filter, and manage all active road anomalies.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search ID or Location..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 glass-card border-slate-700/50 focus-visible:ring-blue-500/50"
            />
          </div>
          <Button variant="outline" className="glass-card hover:bg-slate-800">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
      </motion.div>

      <Card className="glass-card border-slate-800/60 overflow-hidden">
        <div className="bg-slate-900/40 border-b border-slate-800/60 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-3">Detection ID</div>
          <div className="col-span-4">Location</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <div className="h-8 w-8 rounded-full border-b-2 border-blue-500 animate-spin mb-4"></div>
              Querying database...
            </div>
          ) : potholes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No detections found matching your criteria.</div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-800/50">
              {potholes.map((pothole) => (
                <motion.div key={pothole.id} variants={itemVariants}>
                  <Link href={`/potholes/${pothole.id}`} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-800/40 transition-colors group">
                    <div className="col-span-3 flex flex-col">
                      <span className="font-mono text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                        {pothole.potholeCode}
                      </span>
                      <span className="text-xs text-slate-500 font-mono mt-1">
                        {pothole.detectedAt ? format(new Date(pothole.detectedAt), 'MMM dd, HH:mm') : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="col-span-4 flex items-center text-sm text-slate-300">
                      <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                      <span className="truncate">{pothole.roadName || `${pothole.latitude?.toFixed(4)}, ${pothole.longitude?.toFixed(4)}`}</span>
                    </div>
                    
                    <div className="col-span-2">
                      <Badge variant={pothole.severityScore >= 7 ? 'destructive' : pothole.severityScore >= 4 ? 'warning' : 'default'} className="shadow-sm">
                        {pothole.severityScore >= 7 ? <AlertTriangle className="h-3 w-3 mr-1" /> : null}
                        {pothole.severityScore.toFixed(1)} / 10
                      </Badge>
                    </div>

                    <div className="col-span-2">
                      <Badge variant="outline" className="capitalize text-slate-300 border-slate-700 bg-slate-900/50">
                        {pothole.currentStatus?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" className="text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}