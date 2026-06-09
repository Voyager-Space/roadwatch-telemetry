'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { Button, Input, Card, CardContent } from '@roadwatch/ui-components';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('admin@roadwatch.local'); 
  const [password, setPassword] = useState('AdminPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.login({ email, password });
        const data = response.data || response;
        const { user, accessToken } = data;
        
        setAuth(user, accessToken);
        router.push('/dashboard');
      } catch (err: any) {
        console.error("Login Error:", err);
        setError(err.message || 'Unable to connect to the authentication server. Is the backend running?');
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Welcome back</h2>
        <p className="text-sm text-slate-400">
          Enter your credentials to access the operations center.
        </p>
      </div>

      <Card className="glass-card border-slate-800/60 shadow-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Corporate Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@roadwatch.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300" htmlFor="password">
                  Password
                </label>
                <Link href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full mt-2 shadow-glow-sm hover:shadow-glow" isLoading={isLoading}>
              Sign In
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-slate-500">
        Don't have an operations account?{' '}
        <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
          Request access
        </Link>
      </div>
    </motion.div>
  );
}