import { useEffect, useRef, useState } from "react";

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Connecting to WebSocket
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        options.onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onMessage?.(data);
        } catch (error) {
          // Failed to parse WebSocket message
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        options.onDisconnect?.();
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 3000);
      };

      ws.current.onerror = (error) => {
        // WebSocket error occurred
      };
    } catch (error) {
      // Failed to connect to WebSocket, trying to reconnect after 5 seconds
      reconnectTimeout.current = setTimeout(connect, 5000);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    reconnect: connect,
  };
}