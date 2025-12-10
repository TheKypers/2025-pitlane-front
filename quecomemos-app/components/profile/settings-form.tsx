'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/forms/password';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import { AddUserDataForm } from '@/components/forms';
import { validatePasswordWithBreachCheck } from '@/lib/utils/password-validation';
import { User, Mail, Lock, Shield, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { API_BASE_URL } from '@/lib/config/api';


interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: string;
  calorie_goal?: number | null;
}

interface SettingsFormProps {
  initialProfile: UserProfile;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const { updateProfile: updateUserProfile } = useUser();
  const { showSuccess, showError } = useGlobalNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [isPasswordBreached, setIsPasswordBreached] = useState(false);
  
  // Collapsible sections state (only preferences is collapsible, starts collapsed)
  const [preferencesCollapsed, setPreferencesCollapsed] = useState(true);
  
  const supabase = createClient();

  // Toggle function for preferences section
  const togglePreferences = () => {
    setPreferencesCollapsed(prev => !prev);
  };

  // Estados para cada sección
  const [profileData, setProfileData] = useState({
    username: initialProfile?.username || '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch email from Supabase auth and initialize loading
  useEffect(() => {
    const fetchAuthEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const email = user.email;
          setAuthEmail(email);
          // Don't populate profileData.email - keep it empty for placeholder behavior
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthEmail();
  }, [supabase]);

  // Sincronizar estado cuando cambie initialProfile
  useEffect(() => {
    setProfileData(prev => ({
      username: initialProfile?.username || '',
      email: prev.email, // Keep the current email value (empty or user-entered)
    }));
  }, [initialProfile]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;

      // Actualizar username en el backend
      const response = await fetch(`${API_BASE_URL}/profile/${initialProfile.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: profileData.username.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      

      // Actualizar email en Supabase si cambió
      if (profileData.email && profileData.email !== authEmail) {
        const { error: emailError, data } = await supabase.auth.updateUser({
          email: profileData.email,
        });

        console.log('Email update response:', { data, emailError });
        if (emailError) {
          throw new Error('Failed to update email: ' + emailError.message);
        }
        
        // Update local auth email state after successful update
        setAuthEmail(profileData.email);
      }

      // Actualizar el perfil localmente en el contexto (sin refetch)
      updateUserProfile({ 
        username: profileData.username.trim(),
        email: profileData.email 
      });

      showSuccess(
        'Profile Updated!',
        'Your profile information has been successfully updated and changes are reflected across the app.',
        <Settings className="w-8 h-8" />
      );

    } catch (error) {
      showError(
        'Update Failed',
        'Error updating profile: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      showError('Validation Error', 'Current password is required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Validation Error', 'New passwords do not match');
      return;
    }

    // Check if password is breached
    if (isPasswordBreached) {
      showError(
        'Security Warning', 
        'Cannot use a password that has been found in data breaches. Please choose a different password.'
      );
      return;
    }

    // Validate password with breach check
    const passwordValidation = await validatePasswordWithBreachCheck(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      showError('Password Requirements', passwordValidation.errors.join(". "));
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // First, verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Unable to get user email');
      }

      // Verify current password using signInWithPassword
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (verifyError) {
        throw new Error('Current password is incorrect');
      }

      // If current password is correct, proceed with password update
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        throw new Error('Failed to update password: ' + error.message);
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      showSuccess(
        'Password Updated!',
        'Your password has been successfully updated. Please use your new password for future logins.',
        <Lock className="w-8 h-8" />
      );
      
    } catch (error) {
      showError(
        'Update Failed',
        'Error updating password: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-0">
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded-xl"></div>
          <div className="h-40 bg-muted rounded-xl"></div>
          <div className="h-48 bg-muted rounded-xl"></div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account information and security preferences
          </p>
        </div>
      </div>

      {/* User Preferences Section - Now First */}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-4 cursor-pointer" onClick={togglePreferences}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Food Preferences</CardTitle>
            </div>
            {preferencesCollapsed ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
            ) : (
              <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform" />
            )}
          </div>
          <CardDescription>
            Configure your food preferences and dietary requirements first.
          </CardDescription>
        </CardHeader>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          preferencesCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
        }`}>
          <CardContent>
            <AddUserDataForm />
          </CardContent>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Profile Information</CardTitle>
            </div>
            <CardDescription>
              Update your account&apos;s profile information and email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={profileData.username || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  disabled={isUpdatingProfile}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={authEmail || 'Enter email'}
                  disabled={isUpdatingProfile}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>



              <Button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full transition-all duration-200"
                size="lg"
              >
                {isUpdatingProfile ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Updating Profile...
                  </div>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Update */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Security</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Current Password *
                </Label>
                <PasswordInput
                  id="current-password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  required
                  disabled={isUpdatingPassword}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </Label>
                <PasswordInput
                  id="new-password"
                  value={passwordData.newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  showRequirements={true}
                  onBreachStatusChange={setIsPasswordBreached}
                  disabled={isUpdatingPassword}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm New Password
                </Label>
                <PasswordInput
                  id="confirm-password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  disabled={isUpdatingPassword}
                />
              </div>



              <Button
                type="submit"
                disabled={isUpdatingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isPasswordBreached}
                className="w-full transition-all duration-200"
                size="lg"
              >
                {isUpdatingPassword ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}