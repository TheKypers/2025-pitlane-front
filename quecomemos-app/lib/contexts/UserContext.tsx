"use client";
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config/api';

// Interfaces
interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: string;
  calorie_goal?: number | null;
}

interface UserPreferences {
  preferences: number[];
  dietaryRestrictions: number[];
  hasPreferences: boolean;
}

interface UserData {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
}

interface UserContextType {
  userData: UserData;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (preferences: UserPreferences) => void;
  setUsername: (username: string) => void;
}

// Crear el contexto
const UserContext = createContext<UserContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};

// Cache simple en memoria con TTL
const userDataCache = new Map<string, { data: UserData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Props para el provider
interface UserProviderProps {
  children: ReactNode;
}

// Provider del contexto
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>({
    profile: null,
    preferences: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const { data: claims, error: claimsError } = await supabase.auth.getClaims();
      
      if (claimsError || !claims?.claims) {
        // Check if user is in the process of signing out by checking session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // User is signing out, don't show error
          setUserData({ profile: null, preferences: null });
          setLoading(false);
          return;
        }
        throw new Error('No authenticated user');
      }

      const userId = claims.claims.sub;
      const now = Date.now();
      
      // Verificar cache (saltar si forceRefresh es true)
      const cached = userDataCache.get(userId);
      if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
        // Incluso con cache, obtener email fresco de auth ya que puede haber sido actualizado
        const { data: { user } } = await supabase.auth.getUser();
        const emailFromAuth = user?.email || '';
        
        const updatedUserData = {
          ...cached.data,
          profile: cached.data.profile ? {
            ...cached.data.profile,
            email: emailFromAuth
          } : null
        };
        
        setUserData(updatedUserData);
        setLoading(false);
        return;
      }

      // Fetch from API
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;

      if (!jwt) {
        throw new Error('No valid session found');
      }

      // Fetch profile data
      const profileResponse = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      
      // Get email from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      const emailFromAuth = user?.email || '';
      
      // Merge profile data with email from auth
      const completeProfile: UserProfile = {
        ...profileData,
        email: emailFromAuth
      };

      // Fetch preferences data
      const preferencesResponse = await fetch(`${API_BASE_URL}/profile/${userId}/full`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!preferencesResponse.ok) {
        throw new Error('Failed to fetch user preferences');
      }

      const preferencesData = await preferencesResponse.json();
      
      // Extract preferences and dietary restrictions
      const preferences = preferencesData.Preference?.map((pref: { PreferenceID: number }) => pref.PreferenceID) || [];
      const dietaryRestrictions = preferencesData.DietaryRestriction?.map((dr: { DietaryRestrictionID: number }) => dr.DietaryRestrictionID) || [];
      
      // Check if user has any preferences or dietary restrictions set
      const hasPreferences = preferences.length > 0 || dietaryRestrictions.length > 0;
      
      const userPreferences: UserPreferences = {
        preferences,
        dietaryRestrictions,
        hasPreferences,
      };

      const completeUserData: UserData = {
        profile: completeProfile,
        preferences: userPreferences
      };
      
      // Actualizar cache
      userDataCache.set(userId, { 
        data: completeUserData, 
        timestamp: now 
      });
      
      setUserData(completeUserData);
    } catch (err) {
      // Double-check if user is signing out before setting error
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // User is signing out, don't show error
        setUserData({ profile: null, preferences: null });
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUserData({ profile: null, preferences: null });
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Función para actualizar el perfil localmente (sin refetch)
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserData(prevData => ({
      ...prevData,
      profile: prevData.profile ? { ...prevData.profile, ...updates } : null
    }));

    // También actualizar el cache si existe
    const updateCache = async () => {
      const { data: claims } = await supabase.auth.getClaims();
      if (claims?.claims?.sub) {
        const userId = claims.claims.sub;
        const cached = userDataCache.get(userId);
        if (cached && cached.data.profile) {
          const updatedCacheData = {
            ...cached.data,
            profile: { ...cached.data.profile, ...updates }
          };
          userDataCache.set(userId, {
            data: updatedCacheData,
            timestamp: cached.timestamp
          });
        }
      }
    };
    updateCache();
  }, [supabase]);

  // Función para actualizar las preferencias localmente (sin refetch)
  const updatePreferences = useCallback((newPreferences: UserPreferences) => {
    setUserData(prevData => ({
      ...prevData,
      preferences: newPreferences
    }));

    // También actualizar el cache si existe
    const updateCache = async () => {
      const { data: claims } = await supabase.auth.getClaims();
      if (claims?.claims?.sub) {
        const userId = claims.claims.sub;
        const cached = userDataCache.get(userId);
        if (cached) {
          const updatedCacheData = {
            ...cached.data,
            preferences: newPreferences
          };
          userDataCache.set(userId, {
            data: updatedCacheData,
            timestamp: cached.timestamp
          });
        }
      }
    };
    updateCache();
  }, [supabase]);

  // Función específica para actualizar username (más común)
  const setUsername = useCallback((username: string) => {
    updateProfile({ username });
  }, [updateProfile]);


  useEffect(() => {
    const initializeUserData = async () => {
      // Verificar si ya tenemos data válida en cache antes de hacer fetch
      const { data: claims } = await supabase.auth.getClaims();
      if (claims?.claims?.sub) {
        const userId = claims.claims.sub;
        const now = Date.now();
        const cached = userDataCache.get(userId);
        
        // Si tenemos cache válido, usarlo directamente sin loading pero con email fresco
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          // Get fresh email from auth even when using cache
          const { data: { user } } = await supabase.auth.getUser();
          const emailFromAuth = user?.email || '';
          
          const updatedUserData = {
            ...cached.data,
            profile: cached.data.profile ? {
              ...cached.data.profile,
              email: emailFromAuth
            } : null
          };
          
          setUserData(updatedUserData);
          setLoading(false);
          setIsInitialized(true);
          return; // No hacer fetch si el cache es válido
        }
      }
      
      // Solo hacer fetch si no hay cache válido
      await fetchUserData();
      setIsInitialized(true);
    };

    initializeUserData();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Solo responder a eventos de auth después de la inicialización
        if (!isInitialized) return;

        if (event === 'SIGNED_IN') {
          // Solo refrescar si realmente hay un cambio de usuario o es un nuevo login
          const currentUserId = userData.profile?.id;
          const newUserId = session?.user?.id;
          
          // Si no hay usuario actual o el usuario cambió, hacer refresh
          if (!currentUserId || currentUserId !== newUserId) {
            fetchUserData(true); // Forzar refresh para nuevo usuario
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Solo actualizar si hay cambios significativos en la sesión
          // En la mayoría de casos, el token refresh no requiere refetch completo
          const currentUserId = userData.profile?.id;
          const sessionUserId = session?.user?.id;
          
          if (currentUserId !== sessionUserId) {
            fetchUserData(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setError(null); // Clear error immediately on logout
          setUserData({ profile: null, preferences: null });
          setLoading(true);
          setIsInitialized(false);
          userDataCache.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, isInitialized, userData.profile?.id, fetchUserData]);


  const value: UserContextType = {
    userData,
    loading,
    error,
    updateProfile,
    updatePreferences,
    setUsername,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};