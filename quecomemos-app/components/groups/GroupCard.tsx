'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Activity, Calendar, ChefHat } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GroupMember {
  profile: {
    id: string;
    username: string;
  };
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  _count: {
    members: number;
    mealConsumptions: number;
  };
}

interface GroupCardProps {
  group: Group;
  showActivity?: boolean;
  onRegisterMeal?: (group: Group) => void;
  currentUserId?: string;
}

export function GroupCard({ group, showActivity = true, onRegisterMeal, currentUserId }: GroupCardProps) {
  const router = useRouter();
  const isGroupMember = currentUserId && group.members?.some(member => member.profile.id === currentUserId);

const handleClick = () => {
    router.push(`/protected/groups/${group.GroupID}`);
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 hover:from-amber-700/40 hover:to-amber-800/40">
      <div 
        className="cursor-pointer"
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold truncate text-amber-200">
              {group.name}
            </CardTitle>
            {showActivity && (
              <Badge variant="secondary" className="ml-2 bg-amber-700/30 text-amber-200 border-amber-700/50">
                <Activity className="w-3 h-3 mr-1" />
                {group._count.mealConsumptions}
              </Badge>
            )}
          </div>
          {group.description && (
            <p className="text-sm text-gray-300 line-clamp-2">
              {group.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                {formatDate(group.updatedAt)}
              </span>
            </div>
          </div>
          
          {/* Mostrar iniciales de algunos miembros */}
          <div className="flex items-center mt-3 space-x-1">
            {group.members.slice(0, 3).map((member) => (
              <div 
                key={member.profile.id} 
                className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-amber-700 rounded-full border-2 border-background"
              >
                {getInitials(member.profile.username || 'Anonymous')}
              </div>
            ))}
            {group.members.length > 3 && (
              <div className="flex items-center justify-center w-6 h-6 text-xs text-muted-foreground bg-muted rounded-full">
                +{group.members.length - 3}
              </div>
            )}
          </div>
        </CardContent>
      </div>
      
      {/* Register Meal Button */}
      {onRegisterMeal && isGroupMember && (
        <CardContent className="pt-0 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-[#18120b] border border-amber-700 text-amber-600 hover:bg-[#1e1406] hover:text-amber-400 hover:border-amber-600 font-normal"
            style={{ boxShadow: 'none' }}
            onClick={(e) => {
              e.stopPropagation();
              onRegisterMeal(group);
            }}
          >
            <ChefHat className="w-4 h-4 mr-2 text-amber-600" />
            Register Group Meal
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export default GroupCard;