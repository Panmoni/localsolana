import { useState, useEffect } from 'react';
import { Trade } from '@/api';

/**
 * Custom hook for subscribing to real-time trade updates via Server-Sent Events (SSE)
 *
 * @param tradeId The ID of the trade to subscribe to
 * @param apiUrl The base API URL (defaults to the one from environment variables)
 * @returns The latest trade data
 */
export function useTradeUpdates(tradeId: number, apiUrl?: string) {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tradeId) return;

    const baseUrl = apiUrl || import.meta.env.VITE_API_URL || "http://localhost:3000";
    const eventSource = new EventSource(`${baseUrl}/trades/${tradeId}/events`);

    // Connection opened
    eventSource.onopen = () => {
      console.log(`SSE connection opened for trade ${tradeId}`);
      setIsConnected(true);
      setError(null);
    };

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const updatedTrade = JSON.parse(event.data);
        console.log('Trade update received:', updatedTrade);
        setTrade(updatedTrade);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error parsing SSE data'));
      }
    };

    // Handle errors
    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setError(new Error('Error in SSE connection'));
      setIsConnected(false);

      // Close the connection on error
      eventSource.close();

      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
      }, 5000);
    };

    // Cleanup function to close the connection when component unmounts
    return () => {
      console.log(`Closing SSE connection for trade ${tradeId}`);
      eventSource.close();
      setIsConnected(false);
    };
  }, [tradeId, apiUrl]);

  return { trade, error, isConnected };
}

/**
 * Utility function to check if a deadline has expired
 *
 * @param deadline The deadline timestamp as a string
 * @returns Boolean indicating if the deadline has expired
 */
export function isDeadlineExpired(deadline: string | null): boolean {
  if (!deadline) return false;

  const deadlineTime = new Date(deadline).getTime();
  const currentTime = new Date().getTime();

  return currentTime > deadlineTime;
}
