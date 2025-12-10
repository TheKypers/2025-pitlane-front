"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "./custom-checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/contexts/UserContext";
import { API_BASE_URL } from "@/lib/config/api";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { UserCheck } from "lucide-react";

type AddUserDataFormProps = React.ComponentPropsWithoutRef<"div">;

export function AddUserDataForm({
    className,
    ...props
}: AddUserDataFormProps) {
    const { updatePreferences } = useUser();
    const { showSuccess, showError } = useGlobalNotification();
    const [preferences, setPreferences] = useState<number[]>([]);
    const [dietaryRestrictions, setDietaryRestrictions] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, [supabase]);

    useEffect(() => {
        const getUserPreferences = async () => {
            if (!user) return;

            setIsLoadingPreferences(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;

                const response = await fetch(`${API_BASE_URL}/profile/${user.id}/full`, {
                    headers: {
                        "Authorization": `Bearer ${session.access_token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPreferences(data.Preference.map((pref: { PreferenceID: number }) => pref.PreferenceID));
                    setDietaryRestrictions(data.DietaryRestriction.map((dr: { DietaryRestrictionID: number }) => dr.DietaryRestrictionID));
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            } finally {
                setIsLoadingPreferences(false);
            }
        };

        getUserPreferences();
    }, [user, supabase]);

    const handleUpdateUserData = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!user) {
            showError("Authentication Required", "User not authenticated. Please log in and try again.");
            setIsLoading(false);
            return;
        }

        try {
            // Get the access token from Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error("No valid session found");
            }

            // Use the preferences-and-restrictions endpoint
            const headers: HeadersInit = { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            };

            // Use the profile ID from the authenticated user and the preferences-and-restrictions endpoint
            const response = await fetch(`${API_BASE_URL}/profile/${user.id}/preferences-and-restrictions`, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    preferences: preferences,
                    dietaryRestrictions: dietaryRestrictions,
                }),
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update user preferences");
            }
            
            const result = await response.json();
            console.log("User preferences updated successfully", result);
            
            // Actualizar las preferencias localmente en el contexto (sin refetch)
            const updatedPreferences = {
                preferences,
                dietaryRestrictions,
                hasPreferences: preferences.length > 0 || dietaryRestrictions.length > 0
            };
            updatePreferences(updatedPreferences);
            
            showSuccess(
                "Preferences Updated!",
                "Your food preferences and dietary restrictions have been successfully updated.",
                <UserCheck className="w-8 h-8" />
            );
            
        } catch (error: unknown) {
            console.error("Error updating preferences:", error);
            showError(
                "Update Failed",
                error instanceof Error ? error.message : "An unexpected error occurred while updating your preferences."
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className={cn("max-w-md mx-auto", className)} {...props}>
                <Card>
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>Please log in to update your preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">You need to be logged in to access this feature.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn("max-w-md mx-auto", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Update Your Preferences</CardTitle>
                    <CardDescription>
                        Modify your food preferences and dietary restrictions
                        {user?.email && ` for ${user.email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingPreferences ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateUserData}>
                            <div className="grid gap-4">
                                <div>
                                    <Label className="block mb-2">Preferences</Label>
                                    <CustomCheckbox 
                                        initialOptions={preferences.length > 0 ? preferences : []}
                                        endpoint="preferences"
                                        onSelectionChange={setPreferences}
                                    />
                                </div>
                                <div>
                                    <Label className="block mb-2">Dietary Restrictions</Label>
                                    <CustomCheckbox 
                                        initialOptions={dietaryRestrictions.length > 0 ? dietaryRestrictions : []}
                                        endpoint="dietary-restrictions/excluding-for-everyone"
                                        onSelectionChange={setDietaryRestrictions}
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={isLoading || !user} className="mt-4 w-full">
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        Updating Preferences...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4" />
                                        Update Preferences
                                    </div>
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>


        </div>
    );
}