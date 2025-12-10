'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { CustomCheckbox } from '@/components/forms';
import { UserFoods } from '@/components/food';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  [key: string]: unknown;
}

interface AdminUserPreviewProps {
  className?: string;
}

export function AdminUserPreview({ className }: AdminUserPreviewProps) {
  const [selectedPreferences, setSelectedPreferences] = useState<number[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>([]);
  const [previewFoods, setPreviewFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  // Function to fetch foods based on selected user preferences and restrictions
  const fetchPreviewFoods = async () => {
    setIsLoading(true);
    try {
      // Use the same endpoint that regular users use
      const restrictionsParam = selectedRestrictions.length > 0 ? `?restrictions=${selectedRestrictions.join(',')}` : '';
      const response = await fetch(`${API_BASE_URL}/foods/for-user${restrictionsParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const foodsData = await response.json();
        setPreviewFoods(foodsData);
        setIsPreviewActive(true);
      }
    } catch (error) {
      console.error('Error fetching preview foods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh when selections change and preview is active
  useEffect(() => {
    if (isPreviewActive) {
      fetchPreviewFoods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestrictions, isPreviewActive]);

  const handleStartPreview = () => {
    fetchPreviewFoods();
  };

  const handleStopPreview = () => {
    setIsPreviewActive(false);
    setPreviewFoods([]);
  };

  // Create mock user data for the UserFoods component
  const mockUserData = {
    profile: { role: 'user' },
    preferences: {
      preferences: selectedPreferences,
      dietaryRestrictions: selectedRestrictions,
      hasPreferences: selectedPreferences.length > 0 || selectedRestrictions.length > 0
    }
  };

  return (
    <div className={className}>
      <Card className="bg-neutral-800 border-amber-800/30">
        <CardHeader>
          <CardTitle className="text-amber-100 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            User View Preview
          </CardTitle>
          <CardDescription className="text-gray-400">
            Preview what users would see based on their preferences and dietary restrictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Preference Selection */}
            <div>
              <Label className="text-amber-200 mb-3 block">User Preferences</Label>
              <CustomCheckbox
                initialOptions={selectedPreferences}
                endpoint="preferences"
                onSelectionChange={setSelectedPreferences}
              />
            </div>

            {/* Dietary Restrictions Selection */}
            <div>
              <Label className="text-amber-200 mb-3 block">User Dietary Restrictions</Label>
              <CustomCheckbox
                initialOptions={selectedRestrictions}
                endpoint="dietary-restrictions/excluding-for-everyone"
                onSelectionChange={setSelectedRestrictions}
              />
            </div>

            {/* Preview Controls */}
            <div className="flex gap-3">
              <Button
                onClick={handleStartPreview}
                disabled={isLoading}
                className="bg-amber-700 hover:bg-amber-600 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreviewActive ? 'Refresh Preview' : 'Start Preview'}
                  </>
                )}
              </Button>
              
              {isPreviewActive && (
                <Button
                  onClick={handleStopPreview}
                  variant="outline"
                  className="border-amber-700/50 text-amber-200 hover:bg-amber-700/20"
                >
                  Stop Preview
                </Button>
              )}
            </div>

            {/* Preview Info */}
            {isPreviewActive && (
              <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-700/30">
                <p className="text-sm text-amber-200">
                  <strong>Previewing:</strong> User with {selectedPreferences.length} preference(s) and {selectedRestrictions.length} dietary restriction(s)
                </p>
                {selectedRestrictions.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    No dietary restrictions = User can see ALL foods
                  </p>
                )}
                {selectedRestrictions.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    With restrictions = User sees only &quot;For Everyone&quot; foods + foods matching their restrictions
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {isPreviewActive && (
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-amber-200">
              User View ({previewFoods.length} foods visible)
            </h3>
            <p className="text-sm text-gray-400">
              This is exactly what a user with the selected preferences and restrictions would see
            </p>
          </div>
          
          <div className="bg-neutral-900/50 p-4 rounded-lg border border-amber-800/20">
            <UserFoods foods={previewFoods} mockUserData={mockUserData} />
          </div>
        </div>
      )}
    </div>
  );
}