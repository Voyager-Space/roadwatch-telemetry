'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  MapPin, 
  AlertTriangle, 
  Wrench, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  Bell
} from 'lucide-react';
import { cn, Button } from '@roadwatch/ui-components';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/map', label: 'Live Map', icon: MapIcon },
  { href: '/heatmap', label: 'Risk Heatmap', icon: MapPin },
  { href: '/potholes', label: 'Pothole Backlog', icon: AlertTriangle },
  { href: '/maintenance', label: 'Maintenance Tasks', icon: Wrench },
  { href: '/reports', label: 'Reports & Exports', icon: FileText },
  { href: '/settings', label: 'System Settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      
      {/* 💎 THE GLASS SIDEBAR 💎 */}
      <aside 
        className={cn(
          "glass-panel z-20 flex flex-col justify-between transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/60">
            {isSidebarOpen && (
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                RoadWatch
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white hover:bg-slate-800">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 transition-all duration-200 group",
                    isActive 
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}>
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                    {isSidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Area */}
        <div className="border-t border-slate-800/60 p-4">
          <div className={cn("flex items-center", !isSidebarOpen && "justify-center")}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="truncate text-sm font-medium text-slate-200">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500 capitalize">{user?.role_id || 'Admin'}</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className={cn("mt-4 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300", !isSidebarOpen && "px-0")}
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* 💎 MAIN CONTENT AREA 💎 */}
      <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}