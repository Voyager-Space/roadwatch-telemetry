import React from 'react';
import { Activity, ShieldCheck, Map } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-slate-950 font-sans text-slate-200">
      {/* Left Pane: Enterprise Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900/50 p-12 border-r border-slate-800/60 lg:flex">
        {/* Abstract GIS Background Pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>
        
        <div className="relative z-10 flex items-center text-2xl font-bold tracking-tight text-slate-100">
          <Activity className="mr-2 h-8 w-8 text-blue-500" />
          Road<span className="text-blue-500">Watch</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-medium leading-tight text-slate-100">
            Enterprise Intelligence for <br />
            <span className="text-blue-400 font-bold">Smart Infrastructure.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md">
            Real-time telemetry ingestion, AI-driven maintenance forecasting, and sub-meter GIS clustering for municipal operations.
          </p>
          
          <div className="pt-8 grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>SOC2 Compliant</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <Map className="h-5 w-5 text-blue-400" />
              <span>Sub-meter Accuracy</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} RoadWatch Engineering Systems. All rights reserved.
        </div>
      </div>

      {/* Right Pane: Authentication Forms */}
      <div className="relative flex w-full items-center justify-center p-8 lg:w-1/2">
        {/* Subtle glow effect behind the form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="w-full max-w-md space-y-8 relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}