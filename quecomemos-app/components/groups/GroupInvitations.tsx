'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X, Clock, Users } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';

interface Invitation {
  InvitationID: number;
  status: string;
  message?: string;
  createdAt: string;
  group: {
    GroupID: number;
    name: string;
    description?: string;
  };
  invitedBy: {
    id: string;
    username: string;
  };
}

interface GroupInvitationsProps {
  userId: string;
  onInvitationAccepted?: () => void;
}

export function GroupInvitations({ userId, onInvitationAccepted }: GroupInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/groups/invitations/${userId}?status=pending`;
      console.debug('[DEBUG] GroupInvitations.fetchInvitations - url', url);
      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text().catch(() => null);
        console.error('[DEBUG] GroupInvitations.fetchInvitations - failed', { status: response.status, statusText: response.statusText, body: text });
  throw new Error('Error loading invitations');
      }

      const data = await response.json();
      console.debug('[DEBUG] GroupInvitations.fetchInvitations - data', data);
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleInvitationResponse = async (invitationId: number, response: 'accept' | 'reject') => {
    try {
      setProcessing(invitationId);

      const url = `${API_BASE_URL}/groups/invitations/${invitationId}/respond`;
      const payload = { userId, response };
      console.debug('[DEBUG] GroupInvitations.handleInvitationResponse - request', { url, payload });
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error('[DEBUG] GroupInvitations.handleInvitationResponse - failed', { status: res.status, statusText: res.statusText, body: text });
        throw new Error('Error responding to the invitation');
      }

      const result = await res.json().catch(() => null);
      console.debug('[DEBUG] GroupInvitations.handleInvitationResponse - result', result);

      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.InvitationID !== invitationId));
      
      // If invitation was accepted, notify parent to refresh group list
      if (response === 'accept' && onInvitationAccepted) {
        onInvitationAccepted();
      }
      
      
    } catch (error) {
      console.error('Error responding to invitation:', error);
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You have no pending invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Pending Invitations
          </div>
          <Badge variant="secondary">
            {invitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div 
              key={invitation.InvitationID}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium">{invitation.group.name}</h4>
                  </div>
                  
                  {invitation.group.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {invitation.group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Invited by {invitation.invitedBy.username}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{formatDate(invitation.createdAt)}</span>
                  </div>
                  
                  {invitation.message && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      {invitation.message}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleInvitationResponse(invitation.InvitationID, 'accept')}
                  disabled={processing === invitation.InvitationID}
                  className="flex-1 bg-amber-700 hover:bg-amber-600 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInvitationResponse(invitation.InvitationID, 'reject')}
                  disabled={processing === invitation.InvitationID}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default GroupInvitations;