'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useBadges } from '@/lib/contexts/BadgeContext';
import { API_BASE_URL } from '@/lib/config/api';

interface CreateGroupFormProps {
  userId: string;
  onSuccess?: (groupId: number) => void;
}

export function CreateGroupForm({ userId, onSuccess }: CreateGroupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showSuccess, showError } = useGlobalNotification();
  const { processBadgeNotifications } = useBadges();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_BASE_URL}/groups`;
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        createdBy: userId
      };
      console.debug('[DEBUG] CreateGroupForm.handleSubmit - request', { url, payload });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        let errorData = null;
  try { errorData = text ? JSON.parse(text) : null; } catch { /* ignore parse errors */ }
        console.error('[DEBUG] CreateGroupForm.handleSubmit - failed', { status: response.status, statusText: response.statusText, body: text, parsed: errorData });
        throw new Error((errorData && errorData.error) || 'Error creating group');
      }

      const newGroup = await response.json();
      console.debug('[CreateGroupForm] Group creation result:', JSON.stringify(newGroup, null, 2));
      console.log('[CreateGroupForm] badgeNotifications field:', newGroup.badgeNotifications);
      
      // Show themed success notification then navigate
      showSuccess(
        'Group created',
        `Group "${newGroup.name || newGroup.GroupID}" created successfully.`,
      );
      
      // Process badge notifications through BadgeContext modal
      if (newGroup.badgeNotifications && Array.isArray(newGroup.badgeNotifications) && newGroup.badgeNotifications.length > 0) {
        console.log('[CreateGroupForm] Processing badge notifications through context');
        await processBadgeNotifications(newGroup.badgeNotifications);
      }

      // Delay navigation slightly to allow notification to be seen
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(newGroup.GroupID);
           router.replace(`/protected/groups/${newGroup.GroupID}`);
        } else {
          showError('Error creating group', "Unexpected error occurred");
        }
      }, 1);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      showError('Error creating group', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when the user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 border border-amber-700/50 rounded-lg p-6 bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
  <h1 className="text-2xl font-bold">Create New Group</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Group Information
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Gonzalez Family, Marketing Team, etc."
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                maxLength={100}
                required
              />
              <p className="text-sm text-muted-foreground">
                Choose a descriptive name for your group
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the group's purpose, meal types, etc."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Help members understand the group&apos;s purpose
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 bg-amber-700 hover:bg-amber-600 text-white"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="font-medium">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-700 rounded-full mt-2 mr-3 flex-shrink-0" />
                You will automatically be the group&apos;s administrator
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-700 rounded-full mt-2 mr-3 flex-shrink-0" />
                You will be able to invite other users to join
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-700 rounded-full mt-2 mr-3 flex-shrink-0" />
                Members will be able to log group consumptions
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-700 rounded-full mt-2 mr-3 flex-shrink-0" />
                The system will filter foods based on all members&apos; restrictions
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateGroupForm;