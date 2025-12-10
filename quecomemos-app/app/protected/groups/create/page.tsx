'use client';

import React from 'react';
import CreateGroupForm from '@/components/groups/CreateGroupForm';
import { useUser } from '@/lib/contexts/UserContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function CreateGroupSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
          <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
        </div>

        {/* Form skeleton */}
        <Card>
          <CardHeader>
            <div className="w-40 h-6 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Group name field */}
            <div className="space-y-2">
              <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
              <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <div className="w-32 h-4 bg-muted rounded animate-pulse"></div>
              <div className="w-full h-24 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Privacy settings */}
            <div className="space-y-4">
              <div className="w-48 h-5 bg-muted rounded animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="w-32 h-4 bg-muted rounded animate-pulse"></div>
                      <div className="w-48 h-3 bg-muted/70 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <div className="w-24 h-10 bg-muted rounded animate-pulse"></div>
              <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreateGroupPage() {
  const { userData, loading } = useUser();

  // Show loading state or if no authenticated user
  if (loading) {
    return <CreateGroupSkeleton />;
  }

  if (!userData?.profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">You need to log in to create a group.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <CreateGroupForm 
        userId={userData.profile.id}
        onSuccess={(groupId) => {
          // Redirigir al grupo creado será manejado por el componente
          console.log('Group created with ID:', groupId);
        }}
      />
    </div>
  );
}