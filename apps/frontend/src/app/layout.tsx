import './globals.css';
import React from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import QueryProvider from '@/components/providers/query-provider';

// Initialize fonts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata = {
  title: 'RoadWatch Enterprise',
  description: 'AI-Driven Municipal Telemetry Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}