"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  text: string;
  isValid: boolean;
}

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
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
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Password requirements:
      </p>
      <ul className="space-y-1">
        {requirements.map((requirement, index) => (
          <li key={index} className="flex items-center space-x-2 text-sm">
            {requirement.isValid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                requirement.isValid
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {requirement.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}