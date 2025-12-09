'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Users,
  Settings,
  UserMinus,
  UserPlus,
  Activity,
  Clock,
  Crown,
  User,
  Trash2,
  LogOut,
  Edit2,
  Save,
  X,
  Trophy,
  TrendingUp,
  Utensils
} from 'lucide-react';
import UserSearch from '@/components/groups/UserSearch';
import { GroupPreferencesBarChart, GroupMealPreferencesPieChart } from '@/components/dashboard';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useConfirmation } from '@/lib/hooks/useConfirmation';
import { ConfirmationModal } from '@/components/modals';
import { API_BASE_URL } from '@/lib/config/api';
import { GroupMostConsumedResponse } from '@/components/types/group-consumption';
import { UserNameWithBadge } from '@/components/common';

interface GroupMember {
  GroupMemberID: number;
  role: string;
  joinedAt: string;
  profile: {
    id: string;
    username: string;
    role: string;
  };
}

interface PendingInvitation {
  InvitationID: number;
  groupId: number;
  invitedUserId: string;
  invitedById: string;
  status: string;
  message?: string;
  createdAt: string;
  invitedUser: {
    id: string;
    username: string;
    role: string;
  };
  invitedBy: {
    id: string;
    username: string;
    role: string;
  };
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  members: GroupMember[];
  creator: {
    id: string;
    username: string;
    role: string;
  };
}

export default function GroupInfoPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { userData } = useUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [mostConsumedMeals, setMostConsumedMeals] = useState<GroupMostConsumedResponse | null>(null);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const currentUserId = userData?.profile?.id;

  // Memoize existing member ids to avoid passing a new array reference on every render
  const existingMemberIds = useMemo(() => {
    return group ? group.members.map(m => m.profile.id) : [];
  }, [group]);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Group doesn't exist anymore
          setNotFound(true);
          return;
        }
        throw new Error('Error loading group');
      }

      const data = await response.json();
      setGroup(data);
      setEditForm({ name: data.name, description: data.description || '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const fetchMostConsumedMeals = useCallback(async () => {
    try {
      setMealsLoading(true);
      setMealsError(null);
      const response = await fetch(`${API_BASE_URL}/meal-consumptions/groups/${groupId}/most-consumed?limit=3`);

      if (!response.ok) {
        throw new Error('Error loading most consumed meals');
      }

      const data = await response.json();
      setMostConsumedMeals(data);
    } catch (err) {
      console.error('Error fetching most consumed meals:', err);
      setMealsError(err instanceof Error ? err.message : 'Error loading data');
      setMostConsumedMeals(null);
    } finally {
      setMealsLoading(false);
    }
  }, [groupId]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setInvitationsLoading(true);
      setInvitationsError(null);
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invitations?requesterId=${currentUserId}`);

      if (!response.ok) {
        throw new Error('Error loading pending invitations');
      }

      const data = await response.json();
      setPendingInvitations(data);
    } catch (err) {
      console.error('Error fetching pending invitations:', err);
      setInvitationsError(err instanceof Error ? err.message : 'Error loading invitations');
      setPendingInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }, [groupId, currentUserId]);

  const handleCancelInvitation = async (invitationId: number, username: string) => {
    if (!currentUserId) return;

    showConfirmation({
      type: 'question',
      title: 'Cancel invitation',
      message: `Are you sure you want to cancel the invitation sent to ${username}?`,
      confirmText: 'Cancel invitation',
      cancelText: 'Keep invitation'
    }, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/invitations/${invitationId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requesterId: currentUserId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error((errorData && errorData.error) || 'Error cancelling invitation');
        }

        await fetchPendingInvitations(); // Refresh the list
        showSuccess('Invitation cancelled', `Invitation to ${username} was cancelled successfully.`);
      } catch (err) {
        console.error('Error cancelling invitation:', err);
        showError('Error cancelling invitation', err instanceof Error ? err.message : 'Error cancelling invitation');
        throw err;
      }
    });
  };

  useEffect(() => {
    fetchGroup();
    fetchMostConsumedMeals();
  }, [fetchGroup, fetchMostConsumedMeals]);

  useEffect(() => {
    if (group && currentUserId) {
      const adminCheck = group.createdBy === currentUserId ||
        group.members.some(member =>
          member.profile.id === currentUserId && member.role === 'admin'
        );
      if (adminCheck) {
        fetchPendingInvitations();
      }
    }
  }, [group, currentUserId, fetchPendingInvitations]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isUserAdmin = () => {
    if (!group || !currentUserId) return false;
    return group.createdBy === currentUserId ||
      group.members.some(member =>
        member.profile.id === currentUserId && member.role === 'admin'
      );
  };

  const isMember = () => {
    if (!group || !currentUserId) return false;
    return group.members.some(member => member.profile.id === currentUserId);
  };

  const handleSaveGroup = async () => {
    if (!group || !currentUserId) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
          userId: currentUserId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating group');
      }

      await fetchGroup(); // Refresh group data
      // Show success notification for global feedback
      showSuccess('Group updated', `Group "${editForm.name || 'unnamed'}" was updated successfully.`);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating group:', error);
      showError('Error updating group', error instanceof Error ? error.message : 'Error updating the group');
    } finally {
      setSaving(false);
    }
  };

  const { confirmation, showConfirmation, handleConfirm, closeConfirmation } = useConfirmation();
  const { showSuccess, showError } = useGlobalNotification();

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!currentUserId) return;

    showConfirmation({
      type: 'danger',
      title: 'Remove member',
      message: `Are you sure you want to remove ${memberName} from the group? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel'
    }, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${memberId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requesterId: currentUserId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error((errorData && errorData.error) || 'Error removing member');
        }

        await fetchGroup();
        showSuccess('Member removed', `${memberName} was removed from the group.`);
      } catch (err) {
        console.error('Error removing member:', err);
        showError('Error removing member', err instanceof Error ? err.message : 'Error removing member');
        throw err;
      }
    });
  };

  const handleLeaveGroup = async () => {
    if (!currentUserId) return;

    showConfirmation({
      type: 'question',
      title: 'Leave group',
      message: `Are you sure you want to leave the group "${group?.name}"? You will need to be invited again to rejoin.`,
      confirmText: 'Leave',
      cancelText: 'Cancel'
    }, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${currentUserId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requesterId: currentUserId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error((errorData && errorData.error) || 'Error leaving group');
        }

        router.push('/protected/groups');
      } catch (err) {
        console.error('Error leaving group:', err);
        showError('Error leaving group', err instanceof Error ? err.message : 'Error leaving group');
        throw err;
      }
    });
  };

  const handleDeleteGroup = async () => {
    if (!currentUserId) return;

    showConfirmation({
      type: 'danger',
      title: 'Delete group',
      message: `Are you sure you want to delete the group "${group?.name}"? This action cannot be undone and all group data will be lost.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error((errorData && errorData.error) || 'Error deleting group');
        }

        router.replace('/protected/groups');
      } catch (err) {
        console.error('Error deleting group:', err);
        showError('Error deleting group', err instanceof Error ? err.message : 'Error deleting the group');
        throw err;
      }
    });
  };

  // Invite section state & handler
  const [showInviteSection, setShowInviteSection] = useState(false);

  const handleInviteUser = async (userId: string, username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitedUserId: userId,
          invitedById: currentUserId,
          message: `You've been invited to join "${group?.name}"`
        }),
      });

      if (response.status === 409) {
        // Already pending invitation
        showError('Already invited', `${username} already has a pending invitation to this group.`);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error sending invitation');
      }

      // Show success message using global notification
      showSuccess('Invitation sent', `Invitation sent to ${username} successfully.`);

      // Refresh pending invitations list
      fetchPendingInvitations();

    } catch (error) {
      console.error('Error inviting user:', error);
      showError('Error sending invitation', error instanceof Error ? error.message : 'Error sending invitation');
      throw error; // Re-throw para que UserSearch pueda manejarlo
    }
  };










  function GroupInfoSkeleton() {
    return (
      <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
        {/* Header skeleton */}
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="w-56 h-8 bg-muted rounded animate-pulse mb-2"></div>
            <div className="w-80 h-4 bg-muted/70 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Group Details skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-40 h-6 bg-muted rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="w-24 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-full h-20 bg-muted rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* Members skeleton */}
          <Card>
            <CardHeader>
              <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
                      <div className="w-16 h-3 bg-muted/70 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Charts skeleton */}
          <Card>
            <CardHeader>
              <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-40 h-6 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return <GroupInfoSkeleton />;
  }

  if (notFound) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">This is not the group you are looking for</h1>
          <div className="flex justify-center mb-4">
            <Image
              src="https://gifdb.com/images/high/these-are-not-the-droids-you-re-looking-for-page-meme-ygs7tyrw9v1a7k52.gif"
              alt="These aren't the droids you're looking for"
              width={272}
              height={153}
              className="w-90 h-auto rounded shadow-md"
              unoptimized={true}
              style={{ maxWidth: '290px' }}
            />
          </div>

          <div className="flex justify-center">
            <Button onClick={() => router.replace('/protected/groups')} className="bg-amber-700 text-white">
              Go to groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => router.back()}>
                  Back
                </Button>
                <Button onClick={fetchGroup}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Group Information</h1>
          <p className="text-muted-foreground mt-1">
            Manage group details and members
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Group Details
              </div>
              {isUserAdmin() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      setEditForm({ name: group.name, description: group.description || '' });
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Group name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Group description (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSaveGroup}
                    disabled={saving || !editForm.name.trim()}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditForm({ name: group.name, description: group.description || '' });
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-lg">{group.name}</p>
                </div>
                {group.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{group.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(group.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creator</p>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <UserNameWithBadge 
                      username={group.creator.username || 'Anonymous'}
                      profileId={group.creator.id}
                      badgeSize="sm"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your status</p>
                  <Badge variant={isMember() ? 'default' : 'secondary'} className={isMember() ? 'bg-amber-700 hover:bg-amber-600' : ''}>
                    {isMember() ? 'Member' : 'Not a member'}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Members Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Group Members
              </div>
              <div className="flex items-center space-x-2">
                {isUserAdmin() && (
                  <Button
                    variant={showInviteSection ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowInviteSection(v => !v)}
                    className={showInviteSection ? 'bg-amber-700 text-white hover:bg-amber-600' : ''}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                )}
                <Badge variant="outline">{group.members.length}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div
                  key={member.GroupMemberID}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-amber-700 text-white rounded-full text-sm font-medium">
                      {(member.profile.username || 'Anonymous').charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <UserNameWithBadge 
                        username={member.profile.username || 'Anonymous'}
                        profileId={member.profile.id}
                        badgeSize="sm"
                        className="mb-1"
                      />
                      <div className="flex items-center space-x-2">
                        <Badge variant={member.role === 'admin' ? 'default' : 'outline'} className={member.role === 'admin' ? 'text-xs bg-amber-700 hover:bg-amber-600' : 'text-xs'}>
                          {member.role === 'admin' ? (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              Member
                            </>
                          )}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Since {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove member button - only for admins and not for the creator */}
                  {isUserAdmin() && member.profile.id !== group.createdBy && member.profile.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleRemoveMember(member.profile.id, member.profile.username || 'Anonymous')}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {/* Sección de invitar usuarios */}
            {showInviteSection && isUserAdmin() && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold">Invite Users</h2>
                <div className="mt-3">
                  <UserSearch
                    currentUserId={currentUserId || ''}
                    existingMemberIds={existingMemberIds}
                    onInvite={handleInviteUser}
                  />
                </div>
              </div>
            )}

            {/* Pending Invitations Section */}
            {isUserAdmin() && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Pending Invitations
                  </h3>
                  <Badge variant="outline">{pendingInvitations.length}</Badge>
                </div>

                {invitationsError ? (
                  <div className="text-center py-4">
                    <p className="text-destructive mb-2">{invitationsError}</p>
                    <Button variant="outline" size="sm" onClick={fetchPendingInvitations}>
                      Try Again
                    </Button>
                  </div>
                ) : invitationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : pendingInvitations.length > 0 ? (
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.InvitationID}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-muted text-foreground rounded-full text-sm font-medium border">
                            {(invitation.invitedUser.username || 'Anonymous').charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <UserNameWithBadge 
                              username={invitation.invitedUser.username || 'Anonymous'}
                              profileId={invitation.invitedUser.id}
                              badgeSize="sm"
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">Invited by</span>
                              <UserNameWithBadge 
                                username={invitation.invitedBy.username || 'Anonymous'}
                                profileId={invitation.invitedBy.id}
                                badgeSize="sm"
                                usernameClassName="text-xs"
                              />
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(invitation.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>

                          {/* Cancel button - only show if current user sent the invitation */}
                          {invitation.invitedById === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleCancelInvitation(invitation.InvitationID, invitation.invitedUser.username || 'Anonymous')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No pending invitations</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Consumed Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Most Consumed Meals
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMostConsumedMeals}
              disabled={mealsLoading}
            >
              <Activity className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mealsError ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">{mealsError}</p>
              <Button variant="outline" onClick={fetchMostConsumedMeals}>
                Try Again
              </Button>
            </div>
          ) : mealsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : mostConsumedMeals?.mostConsumedMeals && mostConsumedMeals.mostConsumedMeals.length > 0 ? (
            <div className="space-y-4">
              {mostConsumedMeals.mostConsumedMeals.map((meal, index: number) => (
                <div
                  key={meal.mealId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{meal.name}</h4>
                      {meal.description && (
                        <p className="text-sm text-muted-foreground">{meal.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">{meal.count} times consumed</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{meal.uniqueConsumers} different members</span>
                        </div>
                        {meal.averageKcal > 0 && (
                          <div className="flex items-center space-x-1">
                            <Utensils className="w-4 h-4 text-orange-600" />
                            <span className="text-sm">{meal.averageKcal} kcal avg</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {meal.foods && meal.foods.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {meal.foods.slice(0, 3).map((food) => food.name).join(', ')}
                        {meal.foods.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {mostConsumedMeals && mostConsumedMeals.totalConsumptions > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Based on {mostConsumedMeals.totalConsumptions} total consumptions from {mostConsumedMeals.memberCount} members
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No consumption data available</p>
              <p className="text-sm text-muted-foreground">
                Group members haven&apos;t logged any meals yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Preferences Bar Chart */}
      <GroupPreferencesBarChart groupId={groupId} members={group.members} />

      {/* Group Meal Preferences Pie Chart */}
      <GroupMealPreferencesPieChart groupId={groupId} members={group.members} />

      {/* Action Buttons */}
      {isMember() && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Leave Group - for non-creators */}
              {currentUserId !== group.createdBy && (
                <Button
                  variant="outline"
                  className="text-orange-600 hover:text-orange-700"
                  onClick={handleLeaveGroup}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave group
                </Button>
              )}

              {/* Delete Group - only for creators */}
              {isUserAdmin() && currentUserId === group.createdBy && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteGroup}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete group
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Confirmation modal injected globally for this page */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
        customIcon={confirmation.customIcon}
      />
    </div>
  );
}