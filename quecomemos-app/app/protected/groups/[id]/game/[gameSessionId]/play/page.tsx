'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Egg } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { GameService, GameSession } from '@/lib/services/GameService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useBadges } from '@/lib/contexts/BadgeContext';
import RouletteWheel from '@/components/games/roulette-game/RouletteWheel';

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);
  const gameSessionId = parseInt(params.gameSessionId as string);
  const { userData } = useUser();
  const { showError } = useGlobalNotification();
  const { processBadgeNotifications } = useBadges();

  const [loading, setLoading] = useState(true);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [eggShaking, setEggShaking] = useState(false);
  const [eggCracks, setEggCracks] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [rouletteWinner, setRouletteWinner] = useState<{
    winnerId: number;
    winnerProfileId: string;
    meals: Array<{ id: number; name: string; username: string }>;
  } | null>(null);
  
  const clickCountRef = useRef(0);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSeenRouletteAnimation = useRef(false);
  const isCompletingRoulette = useRef(false);

  // Poll for game updates
  const pollGameSession = useCallback(async () => {
    try {
      const updated = await GameService.getGameSession(gameSessionId);
      const prevStatus = gameSession?.status;
      setGameSession(updated);

      // For roulette games, if game just completed and we haven't seen animation yet
      if (updated.gameType === 'roulette' && 
          updated.status === 'completed' &&
          prevStatus !== 'completed' &&
          !hasSeenRouletteAnimation.current &&
          !showWheel) {
        
        const isHost = updated.hostId === userData?.profile?.id;
        
        // Non-hosts: show animation with the winning data from completed game
        if (!isHost && updated.winner && updated.participants) {
          const eligible = updated.participants.filter(p => p.mealId);
          const mealsForWheel = eligible.map(p => ({
            id: p.GameParticipantID,
            name: p.meal?.name || 'Unknown',
            username: p.profile.username
          }));
          
          const winnerParticipant = eligible.find(p => p.profileId === updated.winnerId);
          
          if (winnerParticipant) {
            setRouletteWinner({
              winnerId: winnerParticipant.GameParticipantID,
              winnerProfileId: winnerParticipant.profileId,
              meals: mealsForWheel
            });
            hasSeenRouletteAnimation.current = true;
            setShowWheel(true);
            return; // Don't navigate yet, let animation play
          }
        }
      }

      // Navigate to results when completed
      if (updated.status === 'completed') {
        // For roulette: wait for animation
        if (updated.gameType === 'roulette' && !hasSeenRouletteAnimation.current) {
          return; // Don't navigate yet, animation will handle it
        }
        // For egg_clicker or roulette after animation: navigate to results
        router.replace(`/protected/groups/${groupId}/game/${gameSessionId}/results`);
      }
    } catch (error) {
      console.error('Error polling game session:', error);
    }
  }, [gameSessionId, groupId, router, gameSession?.status, userData, showWheel]);

  useEffect(() => {
    const interval = setInterval(pollGameSession, 2000);
    return () => clearInterval(interval);
  }, [pollGameSession]);

  // Load game session
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const game = await GameService.getGameSession(gameSessionId);
        setGameSession(game);

        // If game is already completed, navigate to results
        if (game.status === 'completed') {
          router.replace(`/protected/groups/${groupId}/game/${gameSessionId}/results`);
          return;
        }

        // If game hasn't started, go back to lobby
        if (game.status === 'waiting' || game.status === 'ready') {
          router.replace(`/protected/groups/${groupId}/game`);
          return;
        }
      } catch {
        showError('Error', 'Failed to load game');
        router.replace(`/protected/groups/${groupId}/game`);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameSessionId, groupId, router, showError]);

  // Handle countdown phase (used by egg_clicker; roulette can skip to playing or host can spin)
  useEffect(() => {
    if (gameSession?.status === 'countdown') {
      setCountdown(3);
      
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
            // Transition to playing
            GameService.startGamePlaying(gameSessionId).catch(console.error);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [gameSession?.status, gameSessionId]);

  // Submit clicks function (egg_clicker only)
  const submitClicks = useCallback(async () => {
    if (!userData?.profile?.id || hasSubmitted) return;

    setHasSubmitted(true);

    try {
      const result = await GameService.submitClickCount(
        gameSessionId,
        userData.profile.id,
        clickCountRef.current
      );
      
      // If game completed (all players submitted), update local state immediately
      if (result.gameSession && result.gameSession.status === 'completed') {
        console.log('[GamePlay] Game completed! Navigating to results...');
        setGameSession(result.gameSession);
        // Navigate to results immediately
        router.replace(`/protected/groups/${groupId}/game/${gameSessionId}/results`);
        return;
      }
      
      // Process badge notifications if game completed and this player won
      if (result.badgeNotifications && result.badgeNotifications.length > 0) {
        console.log('[GamePlay] Processing', result.badgeNotifications.length, 'badge notifications');
        // Backend returns partial badge data, cast to expected type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await processBadgeNotifications(result.badgeNotifications as any);
      }
    } catch (error) {
      console.error('Error submitting clicks:', error);
      showError('Error', 'Failed to submit your score');
    }
  }, [gameSessionId, userData?.profile?.id, hasSubmitted, showError, processBadgeNotifications, router, groupId]);

  const handleForceComplete = async () => {
    if (!userData?.profile?.id || gameSession?.hostId !== userData.profile.id) return;

    try {
      const result = await GameService.forceCompleteGame(gameSessionId, userData.profile.id);
      
      console.log('[GamePlay] Force complete successful, navigating to results...');
      
      // Update local state
      setGameSession(result);
      
      // Process badge notifications if any
      if (result.badgeNotifications && result.badgeNotifications.length > 0) {
        console.log('[GamePlay] Processing', result.badgeNotifications.length, 'badge notifications');
        // Backend returns partial badge data, cast to expected type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await processBadgeNotifications(result.badgeNotifications as any);
      }
      
      // Navigate to results
      router.replace(`/protected/groups/${groupId}/game/${gameSessionId}/results`);
    } catch (error) {
      console.error('Error forcing game completion:', error);
      showError('Error', 'Failed to force complete game');
    }
  };

  // Spin roulette (host only)
  const handleSpinRoulette = async () => {
    if (!userData?.profile?.id || gameSession?.hostId !== userData.profile.id) return;
    if (gameSession?.gameType !== 'roulette') return;
    if (spinning || hasSeenRouletteAnimation.current) return; // Prevent multiple spins

    try {
      setSpinning(true);
      
      // Step 1: Determine winner for animation
      const winnerData = await GameService.determineRouletteWinner(gameSessionId, userData.profile.id);
      
      // Prepare meals for wheel
      const mealsForWheel = winnerData.meals.map(m => ({
        id: m.id,
        name: m.mealName,
        username: m.username
      }));
      
      // Show the wheel and start animation
      setRouletteWinner({
        winnerId: winnerData.winnerId,
        winnerProfileId: winnerData.winnerProfileId,
        meals: mealsForWheel
      });
      hasSeenRouletteAnimation.current = true;
      setShowWheel(true);
      
    } catch (error) {
      console.error('Error spinning roulette:', error);
      showError('Error', 'Failed to spin roulette');
      setSpinning(false);
      hasSeenRouletteAnimation.current = false; // Reset on error
    }
  };

  // Complete roulette after animation
  const handleRouletteComplete = useCallback(async () => {
    if (!userData?.profile?.id || !rouletteWinner) return;
    if (isCompletingRoulette.current) return; // Prevent double execution
    
    const isHost = gameSession?.hostId === userData.profile.id;
    
    // Host completes the game
    if (isHost) {
      isCompletingRoulette.current = true; // Mark as in progress
      try {
        console.log('[GamePlay] Completing roulette with winner:', rouletteWinner.winnerProfileId);
        
        // Step 2: Complete the game on backend with predetermined winner
        const result = await GameService.spinRoulette(
          gameSessionId, 
          userData.profile.id,
          rouletteWinner.winnerProfileId
        );
        
        // Process badge notifications if any
        if (result.badgeNotifications && result.badgeNotifications.length > 0) {
          console.log('[GamePlay] Processing', result.badgeNotifications.length, 'badge notifications');
          // Backend returns partial badge data, cast to expected type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await processBadgeNotifications(result.badgeNotifications as any);
        }
        
        // Hide animation, keep spinning true to prevent re-clicking
        setShowWheel(false);
        // Poll will pick up the completed status and navigate to results
      } catch (error) {
        console.error('Error completing roulette:', error);
        showError('Error', 'Failed to complete roulette');
        // On error, reset states to allow retry
        setSpinning(false);
        setShowWheel(false);
        hasSeenRouletteAnimation.current = false;
        isCompletingRoulette.current = false; // Reset on error
      }
    } else {
      // Non-host: just hide animation and wait for navigation
      setShowWheel(false);
      // Keep spinning true to show loading state
    }
  }, [userData, rouletteWinner, gameSession?.hostId, gameSessionId, processBadgeNotifications, showError]);

  // Handle playing phase
  useEffect(() => {
    if (gameSession?.status === 'playing' && gameSession.startTime) {
      const duration = gameSession.duration * 1000;
      const startTime = new Date(gameSession.startTime).getTime();
      const endTime = startTime + duration;

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(Math.ceil(remaining / 1000));

        if (remaining <= 0) {
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
          }
          // Time's up, transition to submitting state then submit clicks
          GameService.endGameTime(gameSessionId)
            .then(() => submitClicks())
            .catch(console.error);
        }
      };

      updateTimer();
      gameTimerRef.current = setInterval(updateTimer, 100);

      return () => {
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
        }
      };
    }
  }, [gameSession?.status, gameSession?.startTime, gameSession?.duration, submitClicks, gameSessionId]);

  const handleEggClick = () => {
    if (gameSession?.status !== 'playing' || hasSubmitted) return;

    clickCountRef.current += 1;
    setClickCount(clickCountRef.current);
    
    // Visual feedback
    setEggShaking(true);
    setTimeout(() => setEggShaking(false), 100);

    // Add crack every 10 clicks (max 5 cracks)
    if (clickCountRef.current % 10 === 0 && eggCracks < 5) {
      setEggCracks(prev => Math.min(prev + 1, 5));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (countdown !== null && gameSession?.gameType === 'egg_clicker') {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <h2 className="text-4xl font-bold text-yellow-400">Get Ready!</h2>
        <div className="text-9xl font-bold text-yellow-500 animate-pulse">
          {countdown}
        </div>
        <p className="text-xl text-gray-300">Click as fast as you can!</p>
      </div>
    );
  }

  if ((gameSession?.status === 'submitting' || hasSubmitted) && gameSession?.gameType === 'egg_clicker' && gameSession?.status !== 'completed') {
    const isHost = gameSession?.hostId === userData?.profile?.id;
    
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-6">
        <Trophy className="w-24 h-24 text-yellow-400" />
        <h2 className="text-4xl font-bold text-yellow-400">Time&apos;s Up!</h2>
        <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-950/60 border-yellow-700/50 max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-6xl font-bold text-yellow-400">{clickCount}</p>
            <p className="text-xl text-gray-300">clicks</p>
            <div className="text-sm text-gray-400 mt-4">
              {gameSession?.participants.filter(p => p.hasSubmitted).length} / {gameSession?.participants.length} players submitted
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-yellow-500 mx-auto mt-4" />
            <p className="text-sm text-gray-400">Waiting for all players...</p>
            
            {isHost && gameSession?.status === 'submitting' && gameSession?.participants.some(p => p.hasSubmitted) && (
              <Button
                onClick={handleForceComplete}
                variant="outline"
                className="mt-4 border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
              >
                Force Complete (Skip Waiting)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render gameplay based on game type
  if (gameSession?.gameType === 'roulette') {
    const isHost = gameSession?.hostId === userData?.profile?.id;
    
    // Show spinning wheel animation
    if (showWheel && rouletteWinner) {
      return (
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <RouletteWheel
            meals={rouletteWinner.meals}
            winnerId={rouletteWinner.winnerId}
            onSpinComplete={handleRouletteComplete}
          />
        </div>
      );
    }
    
    // Show loading while waiting for host to complete after spinning
    if (spinning && !isHost) {
      return (
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <h3 className="text-2xl font-bold">Host is spinning the roulette...</h3>
              <p className="text-muted-foreground text-center">
                Please wait while the winner is being determined
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // For roulette: Show ONLY the wheel with spin button (no background UI)
    // Prepare meals for the wheel
    const eligibleMeals = gameSession?.participants.filter(p => p.mealId).map(p => ({
      id: p.GameParticipantID,
      name: p.meal?.name || 'Unknown',
      username: p.profile.username
    })) || [];

    // If there are meals and we haven't spun yet, show the wheel ready to spin
    if (eligibleMeals.length > 0 && !spinning && !showWheel) {
      return (
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center space-y-8 max-w-md">
            {/* Minimalist title */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-200">Roulette</h2>
              <p className="text-sm text-gray-400">Let fate decide your meal</p>
            </div>

            {/* Meal proposals list */}
            <div className="w-full space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Proposed Meals</h3>
              <div className="space-y-2">
                {eligibleMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 flex justify-between items-center"
                  >
                    <span className="text-gray-200 font-medium">{meal.name}</span>
                    <span className="text-gray-400 text-sm">by {meal.username}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spin button for host */}
            {isHost ? (
              <button
                onClick={handleSpinRoulette}
                disabled={spinning}
                className="px-12 py-6 bg-black border-2 border-amber-500 text-amber-500 text-2xl font-bold rounded-xl hover:bg-amber-500 hover:text-black transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {spinning ? 'Spinning...' : 'Spin Roulette'}
              </button>
            ) : (
              <div className="text-center text-gray-400 text-lg">
                <p>Waiting for host to spin the roulette...</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback: waiting for meals
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h3 className="text-2xl font-bold">Waiting for meal proposals...</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Timer and Score Header */}
      <div className="flex justify-between items-center">
        <Card className="bg-gradient-to-r from-yellow-900/40 to-yellow-950/60 border-yellow-700/50 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-2xl font-bold">⏱️</span>
            <div>
              <p className="text-xs text-gray-400">Time Remaining</p>
              <p className="text-3xl font-bold text-yellow-400">
                {timeRemaining !== null ? timeRemaining : gameSession?.duration}s
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-900/40 to-yellow-950/60 border-yellow-700/50 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-2xl font-bold">🏆</span>
            <div>
              <p className="text-xs text-gray-400">Your Score</p>
              <p className="text-3xl font-bold text-yellow-400">{clickCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Egg Clicker Area */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <h2 className="text-3xl font-bold text-yellow-400">Click the Egg!</h2>
        
        <div className="relative">
          <Button
            onClick={handleEggClick}
            disabled={gameSession?.status !== 'playing'}
            className={`w-64 h-64 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 hover:from-yellow-200 hover:to-yellow-400 
                       border-4 border-yellow-600 shadow-2xl transition-all duration-100 relative overflow-hidden
                       ${eggShaking ? 'scale-95' : 'scale-100'}`}
            style={{
              boxShadow: '0 10px 40px rgba(234, 179, 8, 0.4)',
            }}
          >
            <Egg className="w-32 h-32 text-yellow-800" />
            
            {/* Crack effects */}
            {Array.from({ length: eggCracks }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(${45 + i * 30}deg, transparent 48%, #422006 48%, #422006 52%, transparent 52%)`,
                  opacity: 0.6,
                }}
              />
            ))}
          </Button>

          {/* Click ripple effect */}
          {eggShaking && (
            <div className="absolute inset-0 rounded-full border-8 border-yellow-400 animate-ping opacity-75" />
          )}
        </div>

        <p className="text-gray-400 text-lg">
          Tap rapidly to break the egg!
        </p>

        {/* Players list */}
        <Card className="bg-zinc-900/60 border-zinc-700/50 max-w-md w-full">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-yellow-400 mb-3">Players</h3>
            <div className="space-y-2">
              {gameSession?.participants.map((participant) => (
                <div
                  key={participant.GameParticipantID}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-300">{participant.profile.username}</span>
                  <span className="text-gray-500">Playing...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
