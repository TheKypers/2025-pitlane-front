'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VotingService } from '@/components/voting/VotingService';
import type { VotingSession } from '@/components/voting/types';

interface UseVotingSessionOptions {
  sessionId: number | null | undefined;
  enabled?: boolean;
  enablePolling?: boolean; // New option to control automatic polling
  onComplete?: (session: VotingSession) => void;
}

/**
 * Hook for polling a specific voting session's details
 * This handles fine-grained updates (votes, proposals, confirmations)
 * Without causing parent component re-renders
 */
export function useVotingSession({ sessionId, enabled = true, enablePolling = false, onComplete }: UseVotingSessionOptions) {
  const [session, setSession] = useState<VotingSession | null>(null);
  const [loading, setLoading] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const previousStatusRef = useRef<string | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Update callback ref
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const fetchSession = useCallback(async (isInitial = false) => {
    if (!sessionId || !mountedRef.current) return;
    
    try {
      if (isInitial) setLoading(true);
      
      const fetchedSession = await VotingService.getVotingSession(sessionId);
      
      if (!mountedRef.current) return;
      
      setSession(prev => {
        // Detect meaningful changes to prevent unnecessary re-renders
        const hasChanges = !prev ||
          prev.status !== fetchedSession.status ||
          prev.proposals?.length !== fetchedSession.proposals?.length ||
          prev.totalVotes !== fetchedSession.totalVotes ||
          prev.winnerMealId !== fetchedSession.winnerMealId ||
          // Check vote count changes
          prev.proposals?.some((p, i) => 
            p.voteCount !== fetchedSession.proposals?.[i]?.voteCount
          ) ||
          // Check confirmation changes
          prev.proposalConfirmations?.length !== fetchedSession.proposalConfirmations?.length ||
          prev.voteConfirmations?.length !== fetchedSession.voteConfirmations?.length;

        if (!hasChanges && !isInitial) {
          return prev; // No changes, don't trigger re-render
        }

        // Handle completion
        if (previousStatusRef.current === 'voting_phase' && fetchedSession.status === 'completed') {
          onCompleteRef.current?.(fetchedSession);
        }
        
        previousStatusRef.current = fetchedSession.status;
        return fetchedSession;
      });
      
      if (isInitial) setLoading(false);
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error fetching voting session:', error);
      if (isInitial) setLoading(false);
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    if (enabled && sessionId) {
      fetchSession(true);
    }
  }, [sessionId, enabled, fetchSession]);

  // Polling for session updates
  useEffect(() => {
    if (!enabled || !sessionId || !enablePolling) return;

    // Clear existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Don't poll if session is already completed
    if (session?.status === 'completed' || session?.status === 'cancelled') {
      return;
    }

    // Poll every 8 seconds for session updates (votes, proposals) - only when enablePolling is true
    pollIntervalRef.current = setInterval(() => {
      if (mountedRef.current && session?.status !== 'completed' && session?.status !== 'cancelled') {
        fetchSession(false);
      }
    }, 8000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, sessionId, enablePolling, session?.status, fetchSession]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const refresh = useCallback(() => {
    fetchSession(false);
  }, [fetchSession]);

  return {
    session,
    loading,
    refresh,
  };
}
