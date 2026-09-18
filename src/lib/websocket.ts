import { useState, useEffect } from 'react';

type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketManager {
  private socket: WebSocket | null = null;
  private listeners: Set<(event: any) => void> = new Set();
  private stateListeners: Set<(state: WebSocketState) => void> = new Set();
  private currentState: WebSocketState = 'disconnected';
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.setState('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.setState('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((listener) => {
            try {
              listener(data);
            } catch (err) {
              // Ignore subscriber errors
            }
          });
        } catch (e) {
          // Ignore non-json packets
        }
      };

      this.socket.onclose = () => {
        this.setState('disconnected');
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        // Prevent uncaught errors in console
        this.setState('error');
      };
    } catch (err) {
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping', time: Date.now() }));
        } catch (e) {
          // Socket might have closed
        }
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  private setState(state: WebSocketState) {
    this.currentState = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  public send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(payload));
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  public subscribe(listener: (event: any) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStateChange(listener: (state: WebSocketState) => void) {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public getState(): WebSocketState {
    return this.currentState;
  }
}

export const wsManager = new WebSocketManager();

export function useLiveWebSocket() {
  const [state, setState] = useState<WebSocketState>(wsManager.getState());

  useEffect(() => {
    return wsManager.onStateChange(setState);
  }, []);

  const broadcastEvent = (eventType: string, data: any = {}) => {
    return wsManager.send({
      type: 'broadcast',
      event: eventType,
      data,
      timestamp: Date.now()
    });
  };

  return {
    state,
    isConnected: state === 'connected',
    broadcastEvent
  };
}
