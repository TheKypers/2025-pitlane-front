'use client';

import React, { useState, useEffect } from 'react';

interface SingleValueSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  showLabels?: boolean;
  formatLabel?: (value: number) => string;
}

export function SingleValueSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = "",
  showLabels = false,
  formatLabel = (val) => val.toString()
}: SingleValueSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  const getValueFromEvent = React.useCallback((event: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return min;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const rawValue = min + (percentage / 100) * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    const newValue = getValueFromEvent(event);
    setLocalValue(newValue);
    onValueChange(newValue);
  };

  const handleTrackClick = (event: React.MouseEvent) => {
    const newValue = getValueFromEvent(event);
    setLocalValue(newValue);
    onValueChange(newValue);
  };

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const newValue = getValueFromEvent(event);
      setLocalValue(newValue);
      onValueChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onValueChange, getValueFromEvent]);

  const percentage = getPercentage(localValue);

  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      {/* Track */}
      <div
        ref={sliderRef}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-amber-800/30 cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Progress */}
        <div
          className="absolute h-full bg-amber-600 rounded-full transition-all"
          style={{
            width: `${percentage}%`
          }}
        />
      </div>
      
      {/* Thumb */}
      <div
        className="absolute block h-5 w-5 rounded-full border-2 border-amber-600 bg-amber-100 cursor-pointer transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
        style={{ left: `calc(${percentage}% - 10px)` }}
        onMouseDown={handleMouseDown}
        tabIndex={0}
        role="slider"
        aria-valuenow={localValue}
        aria-valuemin={min}
        aria-valuemax={max}
      />

      {/* Labels */}
      {showLabels && (
        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-amber-300/70">
          <span>{formatLabel(min)}</span>
          <span>{formatLabel(max)}</span>
        </div>
      )}
    </div>
  );
}
