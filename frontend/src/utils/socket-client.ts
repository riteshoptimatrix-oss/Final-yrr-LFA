import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    const base = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    return base;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export function connectToSession(sessionId: string): Socket {
  if (socket?.connected) {
    socket.emit('subscribe', sessionId);
    return socket;
  }

  const url = getSocketUrl();

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(`${url}/automation-monitor`, {
    path: '/ws',
    transports: ['websocket', 'polling'],
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
    query: { sessionId },
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000,
    autoConnect: true,
    forceNew: true,
    withCredentials: true,
  });

  socket.on('connect', () => {
    if (typeof window !== 'undefined') {
      console.debug(`[Socket] Connected to ${url}/automation-monitor`);
    }
  });

  socket.on('disconnect', (reason) => {
    if (typeof window !== 'undefined') {
      console.debug(`[Socket] Disconnected: ${reason}`);
    }
  });

  socket.on('connect_error', (err) => {
    if (typeof window !== 'undefined') {
      console.debug(`[Socket] Connection error: ${err.message}`);
    }
  });

  return socket;
}

export function disconnectFromSession(sessionId: string): void {
  if (socket?.connected) {
    socket.emit('unsubscribe', sessionId);
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToSession(socket: Socket, sessionId: string): void {
  socket.emit('subscribe', sessionId);
}

export function unsubscribeFromSession(socket: Socket, sessionId: string): void {
  socket.emit('unsubscribe', sessionId);
}
