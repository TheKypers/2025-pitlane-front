'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, X, Home, Utensils, ChefHat, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/contexts/UserContext';

export function UserSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { userData, loading } = useUser();
  const router = useRouter();
  const profile = userData.profile;

  // Cerrar sidebar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevenir scroll del body cuando el sidebar está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cerrar sidebar con tecla ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  if (loading) {
    return (
      <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse"></div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative w-8 h-8 rounded-full bg-amber-800/30 hover:bg-amber-700/40 border border-amber-800/30 p-0 transition-all"
        aria-label="Open user menu"
      >
        <User className="w-4 h-4 text-amber-200" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/25 dark:bg-black/50 z-40 transition-opacity" />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-card shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-l border-border ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">User Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* User Info */}
        <Link
          href="/protected/history"
          onClick={() => setIsOpen(false)}
          className="block p-4 border-b border-border bg-muted/50 hover:bg-amber-800/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-800/30 border border-amber-700/50 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-amber-200" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-card-foreground">
                {profile.username || 'User'}
              </div>
              <div className="text-xs text-muted-foreground">{profile.email}</div>
              <div className="text-xs text-amber-400 capitalize font-medium">
                {profile.role}
              </div>
              <div className="text-xs text-amber-300 mt-1 opacity-75">
                View personal consumption history →
              </div>
            </div>
          </div>
        </Link>

        {/* Menu Items */}
        <div className="p-2">
          <Link
            href="/protected"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-amber-800/20 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-medium text-sm text-card-foreground">Home</div>
              <div className="text-xs text-muted-foreground">
                Go to main dashboard
              </div>
            </div>
          </Link>

          <Link
            href="/protected/foods"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-amber-800/20 rounded-lg transition-colors"
          >
            <Utensils className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-medium text-sm text-card-foreground">Foods</div>
              <div className="text-xs text-muted-foreground">
                Browse and manage foods
              </div>
            </div>
          </Link>

          <Link
            href="/protected/meals"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-amber-800/20 rounded-lg transition-colors"
          >
            <ChefHat className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-medium text-sm text-card-foreground">My Meals</div>
              <div className="text-xs text-muted-foreground">
                View and manage your created meals
              </div>
            </div>
          </Link>

          <Link
            href="/protected/groups"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-amber-800/20 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-medium text-sm text-card-foreground">Groups</div>
              <div className="text-xs text-muted-foreground">
                Manage your meal groups
              </div>
            </div>
          </Link>

          <Link
            href="/protected/history"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-amber-800/20 rounded-lg transition-colors"
          >
            <Activity className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-medium text-sm text-card-foreground">My Profile</div>
              <div className="text-xs text-muted-foreground">
                View your consumption history and calorie goals
              </div>
            </div>
          </Link>

          <Link
            href="/protected/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 w-full p-3 text-left hover:bg-amber-800/20 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-amber-300" />
            <div>
              <div className="font-medium text-sm text-card-foreground">Settings</div>
              <div className="text-xs text-muted-foreground">
                Update your profile and preferences
              </div>
            </div>
          </Link>

          <div className="mt-2 pt-2 border-t border-border">
            <button 
              className="flex items-center gap-3 w-full p-3 text-left hover:bg-red-900/40 rounded-lg transition-colors text-red-400"
              onClick={() => {
                setIsOpen(false);
                import('@/lib/supabase/client').then(({ createClient }) => {
                  const supabase = createClient();
                  supabase.auth.signOut().then(() => {
                    // Clear browser history and replace with login page
                    if (typeof window !== 'undefined' && window.history) {
                      window.history.replaceState(null, '', '/auth/login');
                    }
                    router.replace('/auth/login');
                  });
                });
              }}
            >
              <LogOut className="w-5 h-5" />
              <div>
                <div className="font-medium text-sm">Sign Out</div>
                <div className="text-xs text-red-300">
                  Sign out of your account
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}