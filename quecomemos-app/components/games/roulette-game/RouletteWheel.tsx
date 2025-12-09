'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';

interface RouletteWheelProps {
  meals: Array<{
    id: number;
    name: string;
    username: string;
  }>;
  winnerId: number;
  onSpinComplete: () => void;
}

export default function RouletteWheel({ meals, winnerId, onSpinComplete }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWheel = useCallback((currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    const segmentAngle = (2 * Math.PI) / meals.length;
    const colors = [
      '#F97316', // orange-500
      '#FB923C', // orange-400
      '#FDBA74', // orange-300
      '#FED7AA', // orange-200
    ];

    meals.forEach((meal, index) => {
      const startAngle = index * segmentAngle + currentRotation;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#1F2937'; // gray-800
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      
      // Meal name
      ctx.fillText(meal.name, radius * 0.6, -5);
      
      // Username
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#E5E7EB'; // gray-200
      ctx.fillText(`by ${meal.username}`, radius * 0.6, 10);
      
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#FCD34D'; // amber-300
    ctx.fill();
    ctx.strokeStyle = '#F59E0B'; // amber-500
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw outer border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#EAB308'; // yellow-500
    ctx.lineWidth = 6;
    ctx.stroke();
  }, [meals]);

  useEffect(() => {
    if (!isSpinning) {
      drawWheel(0);
    }
  }, [isSpinning, drawWheel]);

  const spinWheel = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setHasSpun(true);

    // Find winner index
    const winnerIndex = meals.findIndex(m => m.id === winnerId);
    if (winnerIndex === -1) {
      console.error('Winner not found in meals');
      onSpinComplete();
      return;
    }

    // Calculate where winner should land (at top, 12 o'clock = -90 degrees = -PI/2)
    const segmentAngle = (2 * Math.PI) / meals.length;
    const winnerSegmentCenter = winnerIndex * segmentAngle + segmentAngle / 2;
    
    // Add randomness within the winning segment (not always center)
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.6; // 60% of segment width
    
    // Calculate final rotation: point to top (-PI/2) with random offset
    const targetAngle = -Math.PI / 2 - winnerSegmentCenter - randomOffset;
    
    // Add multiple full rotations for dramatic effect (5-7 full spins)
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const totalRotation = targetAngle + fullSpins * 2 * Math.PI;

    // Animation parameters
    const duration = 4000; // 4 seconds
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: ease-out cubic for natural deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const currentRotation = startRotation + totalRotation * easeOutCubic;
      setRotation(currentRotation);
      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setTimeout(onSpinComplete, 500); // Small delay before showing results
      }
    };

    animate();
  };

  return (
    <Card className="bg-gradient-to-br from-orange-900/60 to-orange-950/80 border-orange-700/50 p-8">
      <div className="flex flex-col items-center space-y-6">
        <h2 className="text-3xl font-bold text-orange-300">🎰 Roulette Wheel</h2>
        
        {/* Pointer at top */}
        <div className="relative">
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-yellow-500"></div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="rounded-full shadow-2xl"
            style={{
              boxShadow: '0 0 60px rgba(249, 115, 22, 0.5)',
            }}
          />
        </div>

        {!isSpinning && !hasSpun && (
          <button
            onClick={spinWheel}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            🎲 SPIN!
          </button>
        )}

        {isSpinning && (
          <div className="text-orange-300 text-xl font-semibold animate-pulse">
            Spinning...
          </div>
        )}
        
        {!isSpinning && hasSpun && (
          <div className="text-orange-300 text-xl font-semibold">
            🎉 Winner determined!
          </div>
        )}
      </div>
    </Card>
  );
}
