'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VotingService } from '@/components/voting/VotingService';
import type { VotingSession } from '@/components/voting/types';

interface VotingContextType {
  // Current active session for a group
  activeSession: VotingSession | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshSession: () => Promise<void>;
  startSession: () => Promise<void>;
  clearSession: () => void;
  
  // Notify when a voting session completes
  notifyVotingCompleted: (sessionId: number) => void;
  onVotingCompleted: (callback: (sessionId: number) => void) => () => void;
  
  // Manual sync control
  forceSyncNow: () => Promise<void>;
  lastSyncTime: Date | null;
}

export const VotingContext = createContext<VotingContextType | undefined>(undefined);

interface VotingProviderProps {
  children: React.ReactNode;
  groupId: number;
}

export function VotingProvider({ children, groupId }: VotingProviderProps) {
  const [activeSession, setActiveSession] = useState<VotingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const mountedRef = useRef(true);
  const previousStatusRef = useRef<string | null>(null);
  const completionListenersRef = useRef<Set<(sessionId: number) => void>>(new Set());

  // CRITICAL FIX: Set mountedRef to true on every mount
  useEffect(() => {
    console.debug('[VotingContext] Setting mountedRef to true on mount');
    mountedRef.current = true;
    return () => {
      console.debug('[VotingContext] Setting mountedRef to false on unmount');
      mountedRef.current = false;
    };
  }, []);

  // Periodically trigger session transitions check
  useEffect(() => {
    const checkTransitions = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
        await fetch(`${API_BASE_URL}/voting/sessions/check-transitions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        console.debug('[VotingContext] Triggered session transitions check');
      } catch (error) {
        // Silent fail - this is a background operation
        console.debug('[VotingContext] Session transitions check failed:', error);
      }
    };

    // Check every 15 seconds
    const interval = setInterval(checkTransitions, 15000);
    
    // Initial check after 3 seconds
    const timeout = setTimeout(checkTransitions, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // REST API polling for voting session updates
  useEffect(() => {
    if (!groupId) return;

    console.log('[VotingContext] Starting REST API polling');

    const pollSession = async () => {
      try {
        const sessions = await VotingService.getInitialActiveSession(groupId);
        const session = sessions && sessions.length > 0 ? sessions[0] : null;
        if (session) {
          setActiveSession(session);
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.debug('[VotingContext] REST polling error:', error);
      }
    };

    // Poll every 10 seconds
    const pollInterval = setInterval(pollSession, 10000);

    return () => clearInterval(pollInterval);
  }, [groupId]);

  // Initial load of active session
  useEffect(() => {
    if (!mountedRef.current) {
      console.debug('[VotingContext] fetchActiveSession: component not mounted, returning');
      return;
    }
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] fetchActiveSession: invalid groupId', groupId);
      setActiveSession(null);
      setError(null);
      setLoading(false);
      return;
    }
    
    const fetchSession = async () => {
      try {
        console.debug('[VotingContext] fetchActiveSession: start', { groupId });
        setLoading(true);
        
        console.debug('[VotingContext] fetchActiveSession: calling VotingService.getInitialActiveSession');
        const sessions = await VotingService.getInitialActiveSession(groupId);
        console.debug('[VotingContext] fetchActiveSession: received sessions', { count: sessions?.length, sessions });
        
        const session = sessions && sessions.length > 0 ? sessions[0] : null;
        console.debug('[VotingContext] fetchActiveSession: extracted first session', { session });
        
        if (!mountedRef.current) {
          console.debug('[VotingContext] fetchActiveSession: component unmounted after fetch, skipping state update');
          return;
        }
        
        setLastSyncTime(new Date());
        
        previousStatusRef.current = session?.status || null;
        console.debug('[VotingContext] fetchActiveSession: success, setting session state', { session });
        setActiveSession(session);
        setError(null);
      } catch (err) {
        console.error('[VotingContext] fetchActiveSession: CATCH BLOCK', err);
        if (!mountedRef.current) {
          console.debug('[VotingContext] fetchActiveSession: component unmounted during error handling, skipping state update');
          return;
        }
        
        if (err instanceof Error) {
          console.error('[VotingContext] fetchActiveSession: error details', { message: err.message });
          
          if (err.message.includes('404')) {
            console.debug('[VotingContext] fetchActiveSession: 404 error (no active session), clearing session');
            setActiveSession(null);
            setError(null);
          } else {
            console.error('[VotingContext] fetchActiveSession: error, setting error state');
            setError(err.message);
          }
        } else {
          console.error('[VotingContext] fetchActiveSession: unknown error type', err);
          setError('Unknown error occurred');
        }
      } finally {
        if (mountedRef.current) {
          console.debug('[VotingContext] fetchActiveSession: FINALLY block - setting loading to false');
          setLoading(false);
        }
      }
    };
    
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch active session - exposed for manual refresh
  const fetchActiveSession = useCallback(async (showLoader = false) => {
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) return;
    
    if (showLoader) setLoading(true);
    try {
      const sessions = await VotingService.getInitialActiveSession(groupId);
      const session = sessions && sessions.length > 0 ? sessions[0] : null;
      
      if (mountedRef.current) {
        setActiveSession(session);
        setLastSyncTime(new Date());
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        if (err instanceof Error && err.message.includes('404')) {
          setActiveSession(null);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    } finally {
      if (mountedRef.current && showLoader) {
        setLoading(false);
      }
    }
  }, [groupId]);

  // Manual refresh function
  const refreshSession = useCallback(async () => {
    console.debug('[VotingContext] refreshSession called', { groupId });
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] refreshSession: invalid groupId', groupId);
      return;
    }
    console.debug('[VotingContext] refreshSession: calling fetchActiveSession');
    await fetchActiveSession(false);
  }, [fetchActiveSession, groupId]);

  // Force sync now function - manual refresh with user feedback
  const forceSyncNow = useCallback(async () => {
    console.debug('[VotingContext] forceSyncNow called');
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] forceSyncNow: invalid groupId', groupId);
      return;
    }
    
    try {
      console.debug('[VotingContext] forceSyncNow: starting manual sync with loader');
      await fetchActiveSession(true); // Show loader for manual sync
      console.debug('[VotingContext] forceSyncNow: sync complete');
    } catch (error) {
      console.error('[VotingContext] forceSyncNow: error', error);
      const msg = error instanceof Error ? error.message : String(error || 'Manual sync failed');
      setError(msg);
    }
  }, [fetchActiveSession, groupId]);

  // Start a new session
  const startSession = useCallback(async () => {
    console.debug('[VotingContext] startSession called', { groupId });
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] startSession: invalid groupId', groupId);
      return;
    }
    console.debug('[VotingContext] startSession: calling fetchActiveSession');
    await fetchActiveSession(true);
  }, [fetchActiveSession, groupId]);

  // Clear session (e.g., when leaving group page)
  const clearSession = useCallback(() => {
    console.debug('[VotingContext] clearSession called');
    setActiveSession(null);

    setError(null);
    console.debug('[VotingContext] clearSession: state cleared');
  }, []);

  // Notify all listeners that a voting session has completed
  const notifyVotingCompleted = useCallback((sessionId: number) => {
    console.debug('[VotingContext] notifyVotingCompleted:', sessionId, 'listeners:', completionListenersRef.current.size);
    completionListenersRef.current.forEach(callback => {
      try {
        callback(sessionId);
      } catch (err) {
        console.error('[VotingContext] Error in completion listener:', err);
      }
    });
  }, []);

  // Register a listener for voting completion events
  const onVotingCompleted = useCallback((callback: (sessionId: number) => void) => {
    console.debug('[VotingContext] onVotingCompleted: registering listener');
    completionListenersRef.current.add(callback);
    
    // Return cleanup function
    return () => {
      console.debug('[VotingContext] onVotingCompleted: unregistering listener');
      completionListenersRef.current.delete(callback);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    console.debug('[VotingContext] useEffect (initial fetch): starting, groupId=', groupId);
    fetchActiveSession(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActiveSession]);

  console.debug('[VotingContext] Provider rendering, state=', { groupId, activeSession: activeSession?.VotingSessionID, loading, error: error?.substring(0, 50) });

  const value: VotingContextType = {
    activeSession,
    loading,
    error,
    refreshSession,
    startSession,
    clearSession,
    notifyVotingCompleted,
    onVotingCompleted,
    forceSyncNow,
    lastSyncTime,
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (context === undefined) {
    console.error('[useVoting] ERROR: useVoting must be used within a VotingProvider');
    throw new Error('useVoting must be used within a VotingProvider');
  }
  console.debug('[useVoting] hook called, context state=', { 
    activeSession: context.activeSession?.VotingSessionID, 
    loading: context.loading,
    error: context.error?.substring(0, 50)
  });
  return context;
}
