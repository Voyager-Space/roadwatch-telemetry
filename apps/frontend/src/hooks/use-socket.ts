'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { WebSocketEventType } from '@roadwatch/shared-types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

// Global singleton to prevent connection thrashing during Next.js route transitions
let globalSocket: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    // If the user logs out or token is missing, cleanly disconnect
    if (!token) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setSocket(null);
      }
      return;
    }

    // Only establish a new connection if one doesn't exist
    if (!globalSocket) {
      globalSocket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      globalSocket.on('connect', () => {
        console.log('✅ Connected to Real-time Telemetry Stream');
      });

      globalSocket.on('disconnect', () => {
        console.log('❌ Disconnected from Telemetry Stream');
      });

      globalSocket.on(WebSocketEventType.CONNECTION_ESTABLISHED, (data) => {
        console.log('Gateway acknowledgment:', data);
      });
    }

    setSocket(globalSocket);

    // We do NOT disconnect on component unmount to ensure the socket 
    // stays alive smoothly when the user navigates between the Dashboard and Map.

  }, [token]);

  return socket;
}