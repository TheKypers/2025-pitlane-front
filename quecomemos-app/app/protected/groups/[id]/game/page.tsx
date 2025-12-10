'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users, Clock, Loader2, Gamepad2, Egg, RotateCw } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { GameService, GameSession, GameType } from '@/lib/services/GameService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { ProposeGameMealModal } from '@/components/games/clicker-game/ProposeGameMealModal';
import { GameHistorySection } from '@/components/games/clicker-game/GameHistorySection';

export default function GameLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);
  const { userData } = useUser();
  const { showError, showSuccess } = useGlobalNotification();

  const [loading, setLoading] = useState(true);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [showGameSelection, setShowGameSelection] = useState(true);
  const [minPlayers, setMinPlayers] = useState(1);
  const [showMealProposalModal, setShowMealProposalModal] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);

  // Poll for game updates every 2 seconds
  const pollGameSession = useCallback(async () => {
    if (!gameSession) return;

    try {
      const updated = await GameService.getGameSession(gameSession.GameSessionID);
      setGameSession(updated);

      // Navigate to game when countdown starts
      if (updated.status === 'countdown' || updated.status === 'playing') {
        router.replace(`/protected/groups/${groupId}/game/${updated.GameSessionID}/play`);
      }
    } catch (error) {
      console.error('Error polling game session:', error);
    }
  }, [gameSession, groupId, router]);

  useEffect(() => {
    if (gameSession && ['waiting', 'ready'].includes(gameSession.status)) {
      const interval = setInterval(pollGameSession, 2000);
      return () => clearInterval(interval);
    }
  }, [gameSession, pollGameSession]);

  // Check for active game session on mount
  useEffect(() => {
    const checkActiveGame = async () => {
      try {
        setLoading(true);
        const activeGame = await GameService.getActiveGameSession(groupId);
        
        if (activeGame) {
          setGameSession(activeGame);
          setShowGameSelection(false);
          
          // If game is already in progress, navigate to play page
          if (['countdown', 'playing', 'submitting'].includes(activeGame.status)) {
            router.replace(`/protected/groups/${groupId}/game/${activeGame.GameSessionID}/play`);
          }
          // If completed, show results
          else if (activeGame.status === 'completed') {
            router.replace(`/protected/groups/${groupId}/game/${activeGame.GameSessionID}/results`);
          }
        }
      } catch {
        // No active game, show game selection
        console.log('No active game session');
      } finally {
        setLoading(false);
      }
    };

    checkActiveGame();
  }, [groupId, router]);

  const createGame = async (gameType: GameType) => {
    if (!userData?.profile?.id) {
      showError('Error', 'You must be logged in to create a game');
      return;
    }

    try {
      setLoading(true);
      const newGame = await GameService.createGameSession(
        groupId,
        userData.profile.id,
        gameType,
        30, // 30 seconds duration
        minPlayers
      );
      
      setGameSession(newGame);
      setShowGameSelection(false);
      showSuccess('Game Created!', 'Waiting for players to join...');
    } catch (error: unknown) {
      showError('Error', error instanceof Error ? error.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!userData?.profile?.id || !gameSession) return;
    setShowMealProposalModal(true);
  };

  const handleMealProposal = async (mealId: number) => {
    if (!userData?.profile?.id || !gameSession) return;
    
    setJoiningGame(true);
    try {
      await GameService.joinGameSession(
        gameSession.GameSessionID,
        userData.profile.id,
        mealId
      );
      
      // Refresh game session
      const updated = await GameService.getGameSession(gameSession.GameSessionID);
      setGameSession(updated);
      setShowMealProposalModal(false);
      showSuccess('Joined!', 'You joined the game with your meal proposal');
    } catch (error: unknown) {
      showError('Error', error instanceof Error ? error.message : 'Failed to join game');
    } finally {
      setJoiningGame(false);
    }
  };

  const toggleReady = async () => {
    if (!userData?.profile?.id || !gameSession) return;

    const participant = gameSession.participants.find(
      p => p.profileId === userData.profile?.id
    );

    if (!participant) return;

    try {
      await GameService.markPlayerReady(
        gameSession.GameSessionID,
        userData.profile.id,
        !participant.isReady
      );
      
      // Refresh game session
      const updated = await GameService.getGameSession(gameSession.GameSessionID);
      setGameSession(updated);
    } catch (error: unknown) {
      showError('Error', error instanceof Error ? error.message : 'Failed to update ready status');
    }
  };

  const startGame = async () => {
    if (!userData?.profile?.id || !gameSession) return;

    try {
      await GameService.startGameCountdown(
        gameSession.GameSessionID,
        userData.profile.id
      );
      
      showSuccess('Starting!', 'Game is starting...');
      // Polling will handle navigation
    } catch (error: unknown) {
      showError('Error', error instanceof Error ? error.message : 'Failed to start game');
    }
  };

  const cancelGame = async () => {
    if (!userData?.profile?.id || !gameSession) return;

    try {
      await GameService.cancelGameSession(
        gameSession.GameSessionID,
        userData.profile.id
      );
      
      setGameSession(null);
      setShowGameSelection(true);
      showSuccess('Cancelled', 'Game was cancelled');
    } catch (error: unknown) {
      showError('Error', error instanceof Error ? error.message : 'Failed to cancel game');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isHost = gameSession?.hostId === userData?.profile?.id;
  const currentParticipant = userData?.profile?.id ? gameSession?.participants.find(
    p => p.profileId === userData.profile?.id
  ) : undefined;
  const allReady = gameSession?.participants.every(p => p.isReady) && 
                   (gameSession?.participants.length || 0) >= (gameSession?.minPlayers || 1);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/protected/groups/${groupId}`)}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold">Group Game</h1>
      </div>

      {showGameSelection && !gameSession ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Min Players Setting */}
          <Card className="bg-zinc-900/60 border-zinc-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="minPlayers" className="text-gray-300 whitespace-nowrap">
                  Minimum Players:
                </Label>
                <Input
                  id="minPlayers"
                  type="number"
                  min={1}
                  max={10}
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(parseInt(e.target.value) || 1)}
                  className="w-20 bg-zinc-800 border-zinc-600 text-white"
                />
                <span className="text-sm text-gray-400">
                  (Set to 1 for testing alone)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Game Selection Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card 
              className="cursor-pointer transition-all hover:scale-105 hover:border-yellow-500 bg-gradient-to-br from-yellow-900/20 to-yellow-950/40 border-yellow-700/50"
              onClick={() => createGame('egg_clicker')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-yellow-400">
                  <Egg className="w-8 h-8" />
                  Egg Clicker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-300">
                  Tap the egg as fast as you can! The player with the most clicks wins!
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>30 seconds</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{minPlayers}+ players</span>
                </div>
              </CardContent>
            </Card>

          <Card 
            className="cursor-pointer transition-all hover:scale-105 hover:border-orange-500 bg-gradient-to-br from-orange-900/20 to-orange-950/40 border-orange-700/50"
            onClick={() => createGame('roulette')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-400">
                <RotateCw className="w-8 h-8" />
                Roulette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-300">
                Spin the wheel of fortune! Let fate decide your meal.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>{minPlayers}+ players</span>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Game History */}
          <GameHistorySection groupId={groupId} />
        </div>
      ) : gameSession ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Game Info Card */}
          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/40 border-yellow-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-yellow-400">
                <Gamepad2 className="w-6 h-6" />
                {gameSession.gameType === 'egg_clicker' ? 'Egg Clicker' : 'Roulette'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{gameSession.duration} seconds</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4" />
                  <span>{gameSession.participants.length} players</span>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                Host: <span className="text-yellow-400">{gameSession.host.username}</span>
              </div>

              {gameSession.status === 'waiting' && (
                <div className="text-sm text-yellow-400">
                  ⏳ Waiting for players to join...
                </div>
              )}
              {gameSession.status === 'ready' && (
                <div className="text-sm text-yellow-400">
                  ✓ All players ready! Host can start the game.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card className="bg-zinc-900/60 border-zinc-700/50">
            <CardHeader>
              <CardTitle className="text-yellow-400">Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gameSession.participants.map((participant) => (
                  <div
                    key={participant.GameParticipantID}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${
                        participant.isReady ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex flex-col flex-1">
                        <span className="text-gray-200">
                          {participant.profile.username}
                          {participant.profileId === gameSession.hostId && (
                            <span className="ml-2 text-xs text-yellow-400">(Host)</span>
                          )}
                        </span>
                        {participant.meal && (
                          <span className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                            🍽️ {participant.meal.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {participant.isReady && (
                      <span className="text-yellow-400 text-sm">Ready</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {!currentParticipant ? (
              <>
                <Button
                  onClick={joinGame}
                  disabled={joiningGame}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
                >
                  {joiningGame ? 'Joining...' : 'Join Game'}
                </Button>
                {isHost && (
                  <Button
                    onClick={cancelGame}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Cancel Game
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={toggleReady}
                  variant={currentParticipant.isReady ? 'outline' : 'default'}
                  className={currentParticipant.isReady ? 
                    'border-yellow-500 text-yellow-500' : 
                    'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }
                >
                  {currentParticipant.isReady ? 'Not Ready' : 'Ready Up'}
                </Button>

                {isHost && (
                  <>
                    <Button
                      onClick={startGame}
                      disabled={!allReady || gameSession.status !== 'ready'}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
                    >
                      Start Game
                    </Button>
                    <Button
                      onClick={cancelGame}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Cancel Game
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Meal Proposal Modal */}
      <ProposeGameMealModal
        isOpen={showMealProposalModal}
        onClose={() => setShowMealProposalModal(false)}
        onPropose={handleMealProposal}
        groupId={groupId}
      />
    </div>
  );
}
