"use client";

import * as React from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPasswordBreach } from "@/lib/utils/password-validation";

interface PasswordRequirement {
  text: string;
  isValid: boolean;
  isLoading?: boolean;
}

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showToggle?: boolean;
  showRequirements?: boolean;
  label?: string;
  onBreachStatusChange?: (isBreached: boolean) => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    className, 
    showToggle = true, 
    showRequirements = false, 
    onBreachStatusChange,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isBreachChecking, setIsBreachChecking] = React.useState(false);
    const [isBreached, setIsBreached] = React.useState<boolean | null>(null);
    const [password, setPassword] = React.useState(value?.toString() || "");

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setPassword(newValue);
      if (onChange) {
        onChange(e);
      }
    };

    // Password breach checking effect (only when showRequirements is true)
    React.useEffect(() => {
      if (!showRequirements || !password) {
        return;
      }

      // Check if password meets basic requirements first
      const meetsBasicRequirements = 
        password.length >= 6 &&
        /\d/.test(password) &&
        /[a-zA-Z]/.test(password) &&
        /[A-Z]/.test(password);

      if (meetsBasicRequirements) {
        setIsBreachChecking(true);
        
        const timer = setTimeout(async () => {
          try {
            const result = await checkPasswordBreach(password);
            setIsBreached(result.isBreached);
            setIsBreachChecking(false);
            
            if (onBreachStatusChange) {
              onBreachStatusChange(result.isBreached);
            }
          } catch (error) {
            console.error('Breach check failed:', error);
            setIsBreached(false);
            setIsBreachChecking(false);
            
            if (onBreachStatusChange) {
              onBreachStatusChange(false);
            }
          }
        }, 3000);

        return () => clearTimeout(timer);
      } else {
        setIsBreached(null);
        setIsBreachChecking(false);
        if (onBreachStatusChange) {
          onBreachStatusChange(false);
        }
      }
    }, [password, onBreachStatusChange, showRequirements]);

    const requirements: PasswordRequirement[] = [
      {
        text: "At least 6 characters",
        isValid: password.length >= 6,
      },
      {
        text: "Contains numbers",
        isValid: /\d/.test(password),
      },
      {
        text: "Contains letters",
        isValid: /[a-zA-Z]/.test(password),
      },
      {
        text: "Contains uppercase letters",
        isValid: /[A-Z]/.test(password),
      },
      {
        text: "Not found in data breaches",
        isValid: isBreached === false,
        isLoading: isBreachChecking,
      },
    ];

    const allRequirementsMet = requirements.every(req => req.isValid);

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            value={password}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {showRequirements && (isFocused || password) && (
          <div className="space-y-2 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium text-muted-foreground">
              Password requirements:
            </p>
            <div className="grid gap-2">
              {requirements.map((requirement, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    requirement.isValid 
                      ? "text-green-600" 
                      : "text-muted-foreground"
                  )}
                >
                  {requirement.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : requirement.isValid ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  <span>{requirement.text}</span>
                </div>
              ))}
            </div>
            {allRequirementsMet && !isBreachChecking && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <Check className="h-3 w-3" />
                <span>Password meets all requirements!</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };