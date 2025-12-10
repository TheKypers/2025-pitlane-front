import React, { Suspense } from 'react';
import ClientSearch from './ClientSearch';

export default function CommunityMealsSearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-amber-700/30 rounded animate-pulse"></div>
            <div className="w-64 h-8 bg-amber-700/30 rounded animate-pulse"></div>
          </div>
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
            <div className="w-full h-10 bg-amber-800/30 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-48 h-5 bg-amber-700/30 rounded animate-pulse"></div>
        </div>
      </div>
    }>
      <ClientSearch />
    </Suspense>
  );
}