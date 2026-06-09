'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { Button, Input, Card, CardContent } from '@roadwatch/ui-components';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(formData);
      // Safely extract the user and token depending on how the backend nests it
      const data = response.data || response;
      const { user, accessToken } = data;
      
      setAuth(user, accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      // Safely catch the fetch error message
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Request Access</h2>
        <p className="text-sm text-slate-400">
          Register a new account for the municipal operations center.
        </p>
      </div>

      <Card className="glass-card border-slate-800/60 shadow-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="fullName">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                Corporate Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@city.gov"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Secure Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="phoneNumber">
                Phone Number (Optional)
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full mt-2 shadow-glow-sm hover:shadow-glow" isLoading={isLoading}>
              Create Account
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
          Sign in
        </Link>
      </div>
    </motion.div>
  );
}