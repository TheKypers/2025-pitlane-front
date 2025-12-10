'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
  options: { id: string; name: string }[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function MultiSelect({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = "Select options...",
  className = "",
  label
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));

  const toggleOption = (optionId: string) => {
    const newSelection = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    
    onSelectionChange(newSelection);
  };

  const removeOption = (optionId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== optionId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-amber-200 mb-2">
          {label}
        </label>
      )}
      
      {/* Selected Options Display */}
      {selectedOptions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-800/40 border border-amber-700/50 rounded text-xs text-amber-200"
            >
              {option.name}
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="hover:text-amber-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-amber-800/30 border border-amber-700/50 rounded-lg text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
      >
        <span className={selectedOptions.length === 0 ? "text-amber-300/70" : ""}>
          {selectedOptions.length === 0 
            ? placeholder 
            : `${selectedOptions.length} selected`
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-800 border border-amber-700/50 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-center text-gray-400 text-sm">
              No options available
            </div>
          ) : (
            <div className="py-1">
              {options.map(option => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className="w-full text-left px-3 py-2 hover:bg-amber-800/30 transition-colors flex items-center justify-between"
                  >
                    <span className="text-amber-100">{option.name}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}