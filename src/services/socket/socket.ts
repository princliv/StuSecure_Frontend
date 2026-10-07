import { io, Socket } from 'socket.io-client';
import { BACKEND_ORIGIN } from '@/services/api/client';

const SOCKET_URL = BACKEND_ORIGIN;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket(token: string, orgId?: string) {
  const s = getSocket();
  s.auth = { token };
  s.connect();
  if (orgId) {
    s.emit('org:join', orgId);
  }
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
