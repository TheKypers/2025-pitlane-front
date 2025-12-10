'use client';

import React, { useState, useEffect } from 'react';
import { DoubleValueSlider } from './DoubleValueSlider';

interface CalorieRangeSliderProps {
  minValue: number;
  maxValue: number;
  onRangeChange: (min: number, max: number) => void;
  className?: string;
  step?: number;
  absoluteMin?: number;
  absoluteMax?: number;
}

export function CalorieRangeSlider({
  minValue,
  maxValue,
  onRangeChange,
  className = "",
  step = 10,
  absoluteMin = 0,
  absoluteMax = 3000
}: CalorieRangeSliderProps) {
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);
  const [range, setRange] = useState<[number, number]>([minValue, maxValue]);

  useEffect(() => {
    setLocalMin(minValue);
    setLocalMax(maxValue);
    setRange([minValue, maxValue]);
  }, [minValue, maxValue]);

  const handleSliderChange = (values: [number, number]) => {
    const [min, max] = values;
    setRange(values);
    setLocalMin(min);
    setLocalMax(max);
    onRangeChange(min, max);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(absoluteMin, Math.min(Number(e.target.value) || 0, localMax));
    setLocalMin(value);
    setRange([value, localMax]);
    onRangeChange(value, localMax);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(absoluteMax, Math.max(Number(e.target.value) || 0, localMin));
    setLocalMax(value);
    setRange([localMin, value]);
    onRangeChange(localMin, value);
  };

  const handleMinBlur = () => {
    const correctedMin = Math.max(absoluteMin, Math.min(localMin, localMax));
    if (correctedMin !== localMin) {
      setLocalMin(correctedMin);
      setRange([correctedMin, localMax]);
      onRangeChange(correctedMin, localMax);
    }
  };

  const handleMaxBlur = () => {
    const correctedMax = Math.min(absoluteMax, Math.max(localMax, localMin));
    if (correctedMax !== localMax) {
      setLocalMax(correctedMax);
      setRange([localMin, correctedMax]);
      onRangeChange(localMin, correctedMax);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-amber-200">
          Calories Range
        </label>
        
        {/* Range Slider */}
        <div className="px-3 py-2">
          <DoubleValueSlider
            value={range}
            onValueChange={handleSliderChange}
            max={absoluteMax}
            min={absoluteMin}
            step={step}
            className="w-full"
          />
        </div>

        {/* Manual Input Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-amber-300/70 mb-1">
              Min Calories
            </label>
            <input
              type="number"
              value={localMin}
              onChange={handleMinInputChange}
              onBlur={handleMinBlur}
              min={absoluteMin}
              max={localMax}
              step={step}
              className="w-full px-3 py-2 bg-amber-800/30 border border-amber-700/50 rounded-md text-amber-100 placeholder-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-amber-300/70 mb-1">
              Max Calories
            </label>
            <input
              type="number"
              value={localMax}
              onChange={handleMaxInputChange}
              onBlur={handleMaxBlur}
              min={localMin}
              max={absoluteMax}
              step={step}
              className="w-full px-3 py-2 bg-amber-800/30 border border-amber-700/50 rounded-md text-amber-100 placeholder-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Display Range */}
        <div className="text-center text-sm text-amber-300/70">
          {localMin} - {localMax} kcal
        </div>
      </div>
    </div>
  );
}
