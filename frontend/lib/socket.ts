import { io, Socket } from 'socket.io-client';
import type { SocketOptions } from 'socket.io-client';

let socket: Socket | null = null;

function getBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return apiUrl.replace(/\/api$/, '');
}

export function initSocket(token?: string) {
  if (typeof window === 'undefined') return null;
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  const url = getBaseUrl();
  const options = {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  };

  socket = io(url, options);
  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
