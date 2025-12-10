'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Utensils, Users, Clock, X, Eye, PieChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';
import { MealModal } from '@/components/modals/meal-modal';
import { PortionSelectionModal } from '../voting/PortionSelectionModal';
import { UserNameWithBadge } from '@/components/common';

interface GroupMember {
  profile: {
    id: string;
    username: string;
  };
}

interface GroupConsumption {
  MealConsumptionID: number;
  consumedAt: string;
  meal: {
    MealID: number;
    name: string;
    description?: string;
    mealFoods: Array<{
      food: {
        FoodID: number;
        name: string;
        kCal: number;
        svgLink?: string;
      };
      quantity: number;
    }>;
  };
  group: {
    GroupID: number;
    name: string;
    members: GroupMember[];
  };
}

interface IndividualConsumption {
  MealConsumptionID: number;
  profileId: string;
  portionFraction: number;
  consumedAt: string;
}

interface Participant extends GroupMember {
  hasSelectedPortion: boolean;
  portionFraction?: number;
}

interface RegistrationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumptionId: number | null;
  onPortionRegistered?: () => void;
}

export function RegistrationDetailsModal({ 
  isOpen, 
  onClose, 
  consumptionId,
  onPortionRegistered 
}: RegistrationDetailsModalProps) {
  const { userData } = useUser();
  const [loading, setLoading] = useState(true);
  const [groupConsumption, setGroupConsumption] = useState<GroupConsumption | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Portion selection modal
  const [showPortionModal, setShowPortionModal] = useState(false);
  
  // Meal details modal
  const [showMealModal, setShowMealModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);

  const userId = userData?.profile?.id;

  const loadDetails = async () => {
    if (!consumptionId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch group consumption
      const groupRes = await fetch(`${API_BASE_URL}/meal-consumptions/${consumptionId}`);
      if (!groupRes.ok) throw new Error('Failed to load group consumption');
      const groupData = await groupRes.json();
      setGroupConsumption(groupData);

      // Fetch individual consumptions for this group meal
      const individualRes = await fetch(
        `${API_BASE_URL}/meal-consumptions?mealId=${groupData.mealId}&groupId=${groupData.groupId}&source=group&type=individual`
      );
      
      if (individualRes.ok) {
        const individualData: IndividualConsumption[] = await individualRes.json();
        // Filter to those matching this specific consumption time (within 1 minute)
        const filtered = individualData.filter((c: IndividualConsumption & { consumedAt: string }) => 
          Math.abs(new Date(c.consumedAt).getTime() - new Date(groupData.consumedAt).getTime()) < 60000
        );

        // Create participants array with portion info
        const participantsWithPortions: Participant[] = groupData.group.members.map((member: GroupMember) => {
          const consumption = filtered.find(c => c.profileId === member.profile.id);
          return {
            ...member,
            hasSelectedPortion: !!consumption,
            portionFraction: consumption?.portionFraction
          };
        });

        setParticipants(participantsWithPortions);
      }
    } catch (err) {
      console.error('Failed to load registration details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load registration details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWinningMeal = async () => {
    if (!groupConsumption) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/meals/${groupConsumption.meal.MealID}`);
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
    loadDetails();
    onPortionRegistered?.();
  };

  const getCurrentUserParticipant = () => {
    if (!userId) return null;
    return participants.find(p => p.profile.id === userId);
  };

  useEffect(() => {
    if (isOpen && consumptionId) {
      loadDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, consumptionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderParticipants = () => {
    if (!participants.length) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-neutral-400" />
          <h4 className="font-semibold text-sm text-neutral-300">
            Participants ({participants.length})
          </h4>
        </div>

        <div className="grid gap-2">
          {participants.map((participant) => (
            <div 
              key={participant.profile.id} 
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/50 border border-neutral-700"
            >
              <UserNameWithBadge 
                profileId={participant.profile.id} 
                username={participant.profile.username}
                badgeSize="sm"
                usernameClassName="text-sm font-medium text-neutral-100"
              />
              <div className="flex items-center gap-2">
                {participant.hasSelectedPortion && participant.portionFraction !== undefined ? (
                  <>
                    <PieChart className="h-4 w-4 text-green-500" />
                    <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                      {Math.round(participant.portionFraction * 100)}% of meal
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                    Pending selection
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getWinnerMealForPortionModal = () => {
    if (!groupConsumption) return undefined;

    const mealFoods = groupConsumption.meal.mealFoods.map(mf => ({
      foodId: mf.food.FoodID,
      foodName: mf.food.name,
      quantity: mf.quantity,
      svgLink: mf.food.svgLink,
      kCal: mf.food.kCal
    }));

    const totalCalories = mealFoods.reduce((sum, f) => sum + (f.kCal * f.quantity), 0);

    return {
      mealId: groupConsumption.meal.MealID,
      name: groupConsumption.meal.name,
      description: groupConsumption.meal.description,
      mealFoods,
      totalCalories
    };
  };

  if (!isOpen) return null;

  const currentParticipant = getCurrentUserParticipant();
  const hasSelectedPortion = currentParticipant?.hasSelectedPortion || false;
  const winningMeal = groupConsumption ? {
    mealId: groupConsumption.meal.MealID,
    name: groupConsumption.meal.name,
    description: groupConsumption.meal.description
  } : null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white z-10"
            >
              <X className="h-5 w-5" />
            </Button>

            <CardHeader>
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-2xl">Group Meal Registration</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              {loading && (
                <div className="text-center py-8 text-neutral-400">Loading registration details...</div>
              )}

              {error && (
                <div className="text-center py-8 text-red-400">{error}</div>
              )}

              {!loading && !error && groupConsumption && (
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="flex items-center gap-4 text-sm text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(groupConsumption.consumedAt)}</span>
                    </div>
                    <Badge variant="outline" className="border-amber-700/50 text-amber-200">
                      completed
                    </Badge>
                  </div>

                  {/* Winning Meal Section */}
                  {winningMeal && (
                    <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-950/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Utensils className="h-5 w-5 text-amber-400" />
                            <h3 className="font-semibold text-amber-200">Winning Meal</h3>
                          </div>
                          <p className="text-lg font-medium">{winningMeal.name}</p>
                          {winningMeal.description && (
                            <p className="text-sm text-neutral-400 mt-1">{winningMeal.description}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewWinningMeal}
                          className="border-amber-700/50 text-amber-200 hover:bg-amber-950/50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>

                      {currentParticipant && (
                        <Button
                          onClick={handleSelectPortion}
                          disabled={hasSelectedPortion}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                        >
                          <PieChart className="h-4 w-4 mr-2" />
                          {hasSelectedPortion ? 'Portion Already Selected' : 'Select Your Portion'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Participants Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-amber-400" />
                      <h3 className="font-semibold text-amber-200">Meal Portions</h3>
                    </div>
                    {renderParticipants()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portion Selection Modal */}
      {showPortionModal && winningMeal && userId && consumptionId && (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const winnerMealData = getWinnerMealForPortionModal() as any;
        return (
          <PortionSelectionModal
            isOpen={showPortionModal}
            onClose={() => setShowPortionModal(false)}
            sessionId={consumptionId}
            userId={userId}
            isRegistration={true}
            groupConsumptionId={consumptionId}
            winnerMeal={winnerMealData}
            onSuccess={handlePortionSuccess}
          />
        );
      })()}

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
