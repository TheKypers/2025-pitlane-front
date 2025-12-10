'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Home, Play, Medal, Egg } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { GameService, GameSession } from '@/lib/services/GameService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';

export default function GameResultsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);
  const gameSessionId = parseInt(params.gameSessionId as string);
  const { userData } = useUser();
  const { showError } = useGlobalNotification();

  const [loading, setLoading] = useState(true);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const game = await GameService.getGameSession(gameSessionId);
        setGameSession(game);

        // If game is not completed, redirect
        if (game.status !== 'completed') {
          if (game.status === 'countdown' || game.status === 'playing') {
            router.replace(`/protected/groups/${groupId}/game/${gameSessionId}/play`);
          } else {
            router.replace(`/protected/groups/${groupId}/game`);
          }
        }
      } catch {
        showError('Error', 'Failed to load results');
        router.replace(`/protected/groups/${groupId}/game`);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [gameSessionId, groupId, router, showError]);

  if (loading || !gameSession) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isWinner = gameSession.winner?.id === userData?.profile?.id;
  const sortedParticipants = gameSession.gameType === 'egg_clicker'
    ? [...gameSession.participants].sort((a, b) => b.clickCount - a.clickCount)
    : [...gameSession.participants];

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500">{index + 1}</span>;
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Winner Announcement */}
      <div className="flex flex-col items-center justify-center space-y-6">
        {isWinner ? (
          <>
            <div className="relative">
              <Trophy className="w-32 h-32 text-yellow-400 animate-bounce" />
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold text-yellow-400 text-center">
              You Won! 🎉
            </h1>
          </>
        ) : (
          <>
            <Trophy className="w-24 h-24 text-amber-400" />
            <h1 className="text-4xl font-bold text-amber-400 text-center">
              Game Over!
            </h1>
          </>
        )}
        
        {gameSession.winner && (
          <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-950/60 border-yellow-700/50 max-w-xl">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-lg text-gray-300">Winner</p>
              <p className="text-3xl font-bold text-yellow-400">
                {gameSession.winner.username}
              </p>
              {gameSession.gameType === 'egg_clicker' && (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Egg className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {sortedParticipants[0]?.clickCount || 0} clicks
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Winner's Meal */}
        {gameSession.winningMeal && (
          <Card className="bg-gradient-to-br from-green-900/40 to-green-950/60 border-green-700/50 max-w-xl">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-lg text-gray-300">Chosen Meal</p>
              <p className="text-2xl font-bold text-green-400">
                {gameSession.winningMeal.name}
              </p>
              <p className="text-sm text-gray-400">
                The group will eat this meal! 🍽️
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leaderboard */}
      <Card className="bg-zinc-900/60 border-zinc-700/50 max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Leaderboard
          </h2>
          <div className="space-y-3">
            {sortedParticipants.map((participant, index) => (
              <div
                key={participant.GameParticipantID}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-950/60 border border-yellow-700/50'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-800/40 to-gray-900/60 border border-gray-600/50'
                    : index === 2
                    ? 'bg-gradient-to-r from-amber-900/40 to-amber-950/60 border border-amber-700/50'
                    : 'bg-zinc-800/40 border border-zinc-700/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  {getMedalIcon(index)}
                  <div>
                    <p className="font-semibold text-gray-200">
                      {participant.profile.username}
                      {participant.profileId === userData?.profile?.id && (
                        <span className="ml-2 text-sm text-blue-400">(You)</span>
                      )}
                    </p>
                    {participant.meal && (
                      <p className="text-sm text-gray-400">
                        Proposed: {participant.meal.name}
                      </p>
                    )}
                  </div>
                </div>
                {gameSession.gameType === 'egg_clicker' && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">
                      {participant.clickCount}
                    </p>
                    <p className="text-xs text-gray-400">clicks</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 max-w-2xl mx-auto">
        <Button
          onClick={() => router.push(`/protected/groups/${groupId}`)}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Group
        </Button>
        <Button
          onClick={() => router.push(`/protected/groups/${groupId}/game`)}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </div>
    </div>
  );
}
