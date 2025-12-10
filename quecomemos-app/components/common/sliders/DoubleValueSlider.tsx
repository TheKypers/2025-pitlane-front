'use client';

import React, { useState } from 'react';

interface DoubleValueSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function DoubleValueSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = ""
}: DoubleValueSliderProps) {
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  const getValueFromEvent = React.useCallback((event: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return min;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const rawValue = min + (percentage / 100) * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const handleMouseDown = (event: React.MouseEvent, thumbIndex: number) => {
    event.preventDefault();
    setIsDragging(thumbIndex);
  };

  const handleTrackClick = (event: React.MouseEvent) => {
    const newValue = getValueFromEvent(event);
    const [minVal, maxVal] = value;

    // Determine which thumb is closer
    const distanceToMin = Math.abs(newValue - minVal);
    const distanceToMax = Math.abs(newValue - maxVal);
    
    if (distanceToMin <= distanceToMax) {
      onValueChange([Math.min(newValue, maxVal), maxVal]);
    } else {
      onValueChange([minVal, Math.max(newValue, minVal)]);
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging === null) return;

      const newValue = getValueFromEvent(event);
      const [minVal, maxVal] = value;

      if (isDragging === 0) {
        onValueChange([Math.min(newValue, maxVal), maxVal]);
      } else {
        onValueChange([minVal, Math.max(newValue, minVal)]);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, value, onValueChange, getValueFromEvent]);

  const [minVal, maxVal] = value;
  const minPercentage = getPercentage(minVal);
  const maxPercentage = getPercentage(maxVal);

  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      {/* Track */}
      <div
        ref={sliderRef}
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-amber-800/30 cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Range */}
        <div
          className="absolute h-full bg-amber-600 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`
          }}
        />
      </div>
      
      {/* Min Thumb */}
      <div
        className="absolute block h-5 w-5 rounded-full border-2 border-amber-600 bg-amber-100 cursor-pointer transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
        style={{ left: `calc(${minPercentage}% - 10px)` }}
        onMouseDown={(e) => handleMouseDown(e, 0)}
        tabIndex={0}
        role="slider"
        aria-valuenow={minVal}
        aria-valuemin={min}
        aria-valuemax={max}
      />
      
      {/* Max Thumb */}
      <div
        className="absolute block h-5 w-5 rounded-full border-2 border-amber-600 bg-amber-100 cursor-pointer transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
        style={{ left: `calc(${maxPercentage}% - 10px)` }}
        onMouseDown={(e) => handleMouseDown(e, 1)}
        tabIndex={0}
        role="slider"
        aria-valuenow={maxVal}
        aria-valuemin={min}
        aria-valuemax={max}
      />
    </div>
  );
}
