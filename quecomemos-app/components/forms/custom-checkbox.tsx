"use client";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "../ui/checkbox";
import React from "react";
import { API_BASE_URL } from "@/lib/config/api";
interface CustomCheckboxProps extends React.ComponentPropsWithoutRef<"div"> {
    endpoint: string;
    initialOptions?: number[];
    onSelectionChange?: (selectedIds: number[]) => void;
    onLoadingChange?: (isLoading: boolean) => void;
}

export function CustomCheckbox({
    endpoint,
    initialOptions = [],
    onSelectionChange,
    onLoadingChange,
    className,
    ...props
}: CustomCheckboxProps) {
    const [selectedOptions, setSelectedOptions] = useState(initialOptions);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [options, setOptions] = useState<Array<{PreferenceID?: number, DietaryRestrictionID?: number, name: string}>>([]);
    const handleEndpoint = useCallback(async () => {
        setIsLoading(true);
        onLoadingChange?.(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to fetch options");
            }
            const data = await response.json();
            setOptions(Array.isArray(data) ? data : []);
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsLoading(false);
            onLoadingChange?.(false);
        }
    }, [endpoint, onLoadingChange]);

    useEffect(() => {
        setSelectedOptions(initialOptions);
    }, [initialOptions]);

    useEffect(() => {
        handleEndpoint();
    }, [endpoint, handleEndpoint]);

    return (
        <div className={cn("relative", className)} {...props}>
            {error && (
                <div className="text-red-500 text-sm p-2">
                    Error: {error}
                </div>
            )}
            {!isLoading && !error && (
                <div className="flex flex-col gap-2">
                    {options.map(option => {
                        const optionId = option.PreferenceID || option.DietaryRestrictionID;
                        return (
                            <label key={optionId || option.name} className="flex items-center gap-2">
                                <Checkbox
                                    checked={optionId ? selectedOptions.includes(optionId) : false}
                                    onCheckedChange={(checked: boolean) => {
                                        if (optionId) {
                                            const newSelection = checked
                                                ? [...selectedOptions, optionId]
                                                : selectedOptions.filter(o => o !== optionId);
                                            setSelectedOptions(newSelection);
                                            onSelectionChange?.(newSelection);
                                        }
                                    }}
                                />
                                {option.name}
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}