"use client";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DropdownWrapperProps extends React.ComponentPropsWithoutRef<"div"> {
    children: React.ReactNode;
    label: string;
}

export function DropdownWrapper({
    label,
    children,
    className,
    ...props
}: DropdownWrapperProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={cn("relative", className)} {...props}>
            <Label className="block mb-2">{label}</Label>
            <div className="border rounded-md">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50/25 rounded-md px-3"
                >
                    <span>{label}</span>
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </button>
                {isExpanded && (
                    <div className="border-t p-2">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
