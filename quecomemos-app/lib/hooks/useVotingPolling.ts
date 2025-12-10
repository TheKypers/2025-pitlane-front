import { useState, useEffect, useRef, useCallback } from 'react';
import { VotingService } from '@/components/voting/VotingService';
import type { VotingSession } from '@/components/voting/types';

interface UseVotingPollingOptions {
  sessionId: number;
  enabled?: boolean;
  onVotingComplete?: (session: VotingSession) => void;
  onStatusChange?: (status: string, session: VotingSession) => void;
  pollInterval?: number;
}

interface VotingPollingState {
  session: VotingSession | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for optimized voting session polling
 * Only updates specific data parts to avoid unnecessary re-renders
 */
export function useVotingPolling({
  sessionId,
  enabled = true,
  onVotingComplete,
  onStatusChange,
  pollInterval = 10000
}: UseVotingPollingOptions) {
  const [state, setState] = useState<VotingPollingState>({
    session: null,
    loading: true,
    error: null
  });

  const previousStatusRef = useRef<string | null>(null);
  const currentStatusRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Use refs for callback functions to prevent dependency changes
  const onVotingCompleteRef = useRef(onVotingComplete);
  const onStatusChangeRef = useRef(onStatusChange);
  
  // Update refs when callbacks change
  onVotingCompleteRef.current = onVotingComplete;
  onStatusChangeRef.current = onStatusChange;

  // Stable fetch function that doesn't change
  const fetchSession = useCallback(async (isInitial = false) => {
    if (!mountedRef.current) return;
    
    try {
      if (isInitial) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const session = await VotingService.getVotingSession(sessionId);
      
      if (!mountedRef.current) return; // Check if component is still mounted
      
      // Update current status ref
      currentStatusRef.current = session.status;
      
      setState(prev => {
        // Only update if there are actual changes to prevent unnecessary re-renders
        const hasChanges = !prev.session || 
          prev.session.status !== session.status ||
          prev.session.proposals?.length !== session.proposals?.length ||
          JSON.stringify(prev.session.proposals?.map(p => p.votes)) !== JSON.stringify(session.proposals?.map(p => p.votes)) ||
          JSON.stringify(prev.session.proposalConfirmations) !== JSON.stringify(session.proposalConfirmations) ||
          JSON.stringify(prev.session.voteConfirmations) !== JSON.stringify(session.voteConfirmations);

        if (!hasChanges && !isInitial) {
          return prev; // No changes, don't trigger re-render
        }

        return {
          ...prev,
          session,
          loading: false,
          error: null
        };
      });

      // Handle status changes
      if (previousStatusRef.current && previousStatusRef.current !== session.status) {
        onStatusChangeRef.current?.(session.status, session);
        
        // Handle voting completion
        if (previousStatusRef.current === 'voting_phase' && session.status === 'completed') {
          onVotingCompleteRef.current?.(session);
        }
        
        // Stop polling if session is completed
        if (session.status === 'completed' || session.status === 'cancelled') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
      
      previousStatusRef.current = session.status;

    } catch (error) {
      if (!mountedRef.current) return;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch session'
      }));
    }
  }, [sessionId]);

  // Initialize and manage polling
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchSession(true);

    // Setup polling
    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        // Check status before polling to avoid unnecessary requests
        if (currentStatusRef.current === 'completed' || currentStatusRef.current === 'cancelled') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        
        fetchSession(false);
      }, pollInterval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, sessionId, pollInterval, fetchSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchSession(false);
  }, [fetchSession]);

  // Stop polling manually
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    session: state.session,
    loading: state.loading,
    error: state.error,
    refresh,
    stopPolling
  };
}