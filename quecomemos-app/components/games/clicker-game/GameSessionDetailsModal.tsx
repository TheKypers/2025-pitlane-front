'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock, X, Eye, Gamepad2, Egg, PieChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GameHistoryService, GameSessionDetails } from './GameHistoryService';
import { MealModal } from '@/components/modals/meal-modal';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';
import { PortionSelectionModal } from '@/components/voting/PortionSelectionModal';
import { PrimaryBadgeDisplay } from '@/components/profile/badges/PrimaryBadgeDisplay';

interface GameSessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number | null;
  onPortionRegistered?: () => void;
}

export function GameSessionDetailsModal({ 
  isOpen, 
  onClose, 
  sessionId,
  onPortionRegistered 
}: GameSessionDetailsModalProps) {
  const { userData } = useUser();
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<GameSessionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Portion selection modal
  const [showPortionModal, setShowPortionModal] = useState(false);
  
  // Meal details modal
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{
    MealID: number;
    name: string;
    description?: string;
    preparationTime?: number;
    servings?: number;
    createdAt: string;
    updatedAt: string;
    profileId: string;
    profile: {
      username?: string;
      id: string;
      role: string;
    };
    mealFoods: Array<{
      food: {
        FoodID: number;
        name: string;
        svgLink?: string;
        kCal: number;
      };
      quantity: number;
    }>;
  } | null>(null);

  const userId = userData?.profile?.id;

  const loadSessionDetails = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const details = await GameHistoryService.getGameSessionDetails(sessionId);
      setSessionDetails(details);
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWinningMeal = async () => {
    if (!sessionDetails?.winningMeal) return;
    
    try {
      // Fetch full meal details from API
      const response = await fetch(`${API_BASE_URL}/meals/${sessionDetails.winningMeal.mealId}`);
      if (!response.ok) throw new Error('Failed to fetch meal details');
      
      const mealData = await response.json();
      setSelectedMeal(mealData);
      setShowMealModal(true);
    } catch (err) {
      console.error('Error loading meal details:', err);
    }
  };

  const handleSelectPortion = () => {
    setShowPortionModal(true);
  };

  const handlePortionSuccess = () => {
    // Reload session details to update participant status
    loadSessionDetails();
    onPortionRegistered?.();
  };

  const getCurrentUserParticipant = () => {
    if (!userId || !sessionDetails?.participants) return null;
    return sessionDetails.participants.find(p => p.profile.id === userId);
  };

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'egg_clicker':
        return <Egg className="h-5 w-5 text-amber-400" />;
      default:
        return <Gamepad2 className="h-5 w-5 text-amber-400" />;
    }
  };

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'egg_clicker':
        return 'Egg Clicker';
      default:
        return gameType;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <Card 
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-amber-900/30 to-amber-950/50 border-amber-700/50 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="sticky top-0 bg-gradient-to-br from-amber-900/90 to-amber-950/90 backdrop-blur-sm z-10 border-b border-amber-700/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-amber-400 mb-2">
                  {sessionDetails && getGameIcon(sessionDetails.gameType)}
                  Game Session Details
                </CardTitle>
                {sessionDetails && (
                  <div className="flex items-center gap-3 text-sm text-neutral-300">
                    <span>{getGameName(sessionDetails.gameType)}</span>
                    <Badge variant="outline" className="border-amber-600 text-amber-300">
                      {sessionDetails.duration}s
                    </Badge>
                    <span className="text-neutral-400">
                      {formatDate(sessionDetails.createdAt)}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : sessionDetails ? (
              <>
                {/* Winner Section */}
                {sessionDetails.winner && sessionDetails.winningMeal && (
                  <Card className="border-yellow-600/50 bg-yellow-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            <h3 className="font-semibold text-lg text-amber-200">Winner</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-base font-medium text-neutral-100">
                              {sessionDetails.winner.username}
                            </p>
                            <PrimaryBadgeDisplay 
                              profileId={sessionDetails.winner.id} 
                              size="sm"
                              showName={false}
                              className="inline-flex"
                            />
                          </div>
                          <p className="text-sm text-neutral-400">
                            {sessionDetails.winner.clickCount} clicks
                          </p>
                          <div className="mt-3 pt-3 border-t border-yellow-600/30">
                            <p 
                              className="text-base font-medium text-neutral-100 hover:text-amber-200 cursor-pointer transition-colors"
                              onClick={handleViewWinningMeal}
                            >
                              🍽️ {sessionDetails.winningMeal.name}
                            </p>
                            {sessionDetails.winningMeal.description && (
                              <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
                                {sessionDetails.winningMeal.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewWinningMeal}
                          className="flex-1 border-yellow-600 text-yellow-300 hover:bg-yellow-900/30"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Meal Details
                        </Button>
                        
                        {/* Show portion selection for participants */}
                        {getCurrentUserParticipant() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectPortion}
                            className={`flex-1 ${
                              (getCurrentUserParticipant()?.mealPortions?.length ?? 0) > 0
                                ? 'border-amber-600 text-amber-300'
                                : 'border-amber-600 text-amber-300 hover:bg-amber-900/30'
                            }`}
                          >
                            <PieChart className="h-4 w-4 mr-2" />
                            {(getCurrentUserParticipant()?.mealPortions?.length ?? 0) > 0
                              ? 'View/Edit Portion'
                              : 'Register Portion'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Participants Section */}
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({sessionDetails.participants.length})
                  </h3>
                  <div className="space-y-2">
                    {sessionDetails.participants
                      .sort((a, b) => b.clickCount - a.clickCount)
                      .map((participant, index) => (
                        <Card 
                          key={participant.participantId}
                          className={`${
                            participant.profile.id === sessionDetails.winner?.id
                              ? 'border-yellow-600/50 bg-yellow-900/10'
                              : 'border-neutral-700/50 bg-neutral-800/30'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-bold text-neutral-400">
                                    #{index + 1}
                                  </span>
                                  <span className="font-medium text-neutral-100">
                                    {participant.profile.username}
                                  </span>
                                  <PrimaryBadgeDisplay 
                                    profileId={participant.profile.id} 
                                    size="sm"
                                    showName={false}
                                    className="inline-flex"
                                  />
                                  {participant.profile.id === sessionDetails.winner?.id && (
                                    <Trophy className="h-4 w-4 text-yellow-400 ml-1" />
                                  )}
                                </div>
                                
                                {/* Proposed meal */}
                                {participant.proposedMeal && (
                                  <p className="text-sm text-amber-300 mt-1">
                                    🍽️ Proposed: {participant.proposedMeal.name}
                                  </p>
                                )}
                                
                                {/* Portion status */}
                                {participant.mealPortions.length > 0 && (
                                  <p className="text-xs text-amber-400 mt-1">
                                    ✓ Portion registered
                                  </p>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-xl font-bold text-amber-400">
                                  {participant.clickCount}
                                </div>
                                <p className="text-xs text-neutral-400">clicks</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Game Info */}
                <div className="flex items-center gap-4 text-sm text-neutral-400 pt-4 border-t border-amber-700/30">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Started: {sessionDetails.startTime && formatDate(sessionDetails.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Ended: {sessionDetails.endTime && formatDate(sessionDetails.endTime)}</span>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Portion Selection Modal */}
      {showPortionModal && sessionDetails?.winningMeal && sessionId && (
        <PortionSelectionModal
          isOpen={showPortionModal}
          onClose={() => setShowPortionModal(false)}
          sessionId={sessionId}
          mealId={sessionDetails.winningMeal.mealId}
          mealName={sessionDetails.winningMeal.name}
          winnerMeal={{
            mealId: sessionDetails.winningMeal.mealId,
            name: sessionDetails.winningMeal.name,
            description: sessionDetails.winningMeal.description,
            mealFoods: sessionDetails.winningMeal.foods.map(f => ({
              foodId: f.foodId,
              foodName: f.name,
              quantity: f.quantity,
              kCal: f.kCal
            })),
            totalCalories: sessionDetails.winningMeal.foods.reduce((sum, f) => 
              sum + (f.kCal * f.quantity), 0
            )
          }}
          userId={userId}
          isGameSession={true}
          onSuccess={handlePortionSuccess}
        />
      )}

      {/* Meal Details Modal */}
      {selectedMeal && (
        <MealModal
          meal={selectedMeal}
          isOpen={showMealModal}
          onClose={() => {
            setShowMealModal(false);
            setSelectedMeal(null);
          }}
        />
      )}
    </>
  );
}

