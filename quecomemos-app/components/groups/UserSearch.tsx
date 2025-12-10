'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';
import { PrimaryBadgeDisplay } from '../profile/badges/PrimaryBadgeDisplay';

interface User {
  id: string;
  username: string;
  role: string;
}

interface UserSearchProps {
  currentUserId: string;
  existingMemberIds: string[];
  onInvite: (userId: string, username: string) => Promise<void>;
}

export function UserSearch({ currentUserId, existingMemberIds, onInvite }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setUsers([]);
      setSearchPerformed(false);
      return;
    }

    try {
      setLoading(true);
      setSearchPerformed(true);
      
      // Excluir usuario actual y miembros existentes
      const excludeIds = [currentUserId, ...existingMemberIds];
      const excludeParam = excludeIds.join(',');
      
      const response = await fetch(
        `${API_BASE_URL}/groups/search/users?query=${encodeURIComponent(searchQuery)}&excludeIds=${excludeParam}`
      );
      
      if (!response.ok) {
        throw new Error('Error searching users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, existingMemberIds]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const handleInvite = async (user: User) => {
    try {
      setInviting(user.id);
      await onInvite(user.id, user.username);
      
      // Remover usuario de la lista después de enviar invitación
      setUsers(prev => prev.filter(u => u.id !== user.id));

      // Reset search input after successful invite
      setQuery('');
      setSearchPerformed(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      // El error debería ser manejado por el componente padre
    } finally {
      setInviting(null);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Searching users...</span>
            </div>
          )}

          {!loading && searchPerformed && users.length === 0 && query.length >= 2 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No users found with &quot;{query}&quot;
              </p>
            </div>
          )}

          {!loading && !searchPerformed && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Type at least 2 characters to search users
              </p>
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Users found ({users.length})
              </h4>
              
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.username}</p>
                        <PrimaryBadgeDisplay 
                          profileId={user.id} 
                          size="sm"
                          showName={false}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleInvite(user)}
                    disabled={inviting === user.id}
                    className="bg-amber-700 hover:bg-amber-600 text-white"
                  >
                    {inviting === user.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Invite
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default UserSearch;