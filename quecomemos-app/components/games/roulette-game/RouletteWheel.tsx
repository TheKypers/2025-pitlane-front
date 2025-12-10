'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Trophy } from 'lucide-react';

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
  const [animationComplete, setAnimationComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasStartedAnimation = useRef(false);

  // Enhanced color palette for better visibility
  const colors = useMemo(() => [
    '#F97316', // orange-500
    '#FB923C', // orange-400
    '#FDBA74', // orange-300
    '#FED7AA', // orange-200
    '#EA580C', // orange-600
    '#C2410C', // orange-700
  ], []);

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

    meals.forEach((meal, index) => {
      const startAngle = index * segmentAngle + currentRotation;
      const endAngle = startAngle + segmentAngle;
      const midAngle = startAngle + segmentAngle / 2;

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

      // Draw text (readable regardless of orientation)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(midAngle);
      
      // Determine if text should be upside down and flip if needed
      const textRotation = midAngle % (2 * Math.PI);
      const shouldFlipText = textRotation > Math.PI / 2 && textRotation < (3 * Math.PI) / 2;
      
      if (shouldFlipText) {
        // Flip text to make it readable when upside down
        ctx.rotate(Math.PI);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(meal.name, -radius * 0.65, 5);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#E5E7EB';
        ctx.fillText(`by ${meal.username}`, -radius * 0.65, 22);
      } else {
        // Normal text orientation
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(meal.name, radius * 0.65, -5);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#E5E7EB';
        ctx.fillText(`by ${meal.username}`, radius * 0.65, 12);
      }
      
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fillStyle = '#FCD34D';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw center icon
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍽️', centerX, centerY);

    // Draw outer border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 6;
    ctx.stroke();
  }, [meals, colors]);

  // Initial draw
  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  // Spin animation effect - runs ONCE when component mounts
  useEffect(() => {
    if (hasStartedAnimation.current) return;
    hasStartedAnimation.current = true;

    const winnerIndex = meals.findIndex(m => m.id === winnerId);
    if (winnerIndex === -1) {
      console.error('[RouletteWheel] Winner not found in meals');
      onSpinComplete();
      return;
    }

    console.log('[RouletteWheel] Starting animation to winner:', meals[winnerIndex].name);

    // Calculate target rotation
    const segmentAngle = (2 * Math.PI) / meals.length;
    const winnerSegmentCenter = winnerIndex * segmentAngle + segmentAngle / 2;
    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.5;
    const targetAngle = -Math.PI / 2 - winnerSegmentCenter - randomOffset;
    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const totalRotation = targetAngle + fullSpins * 2 * Math.PI;

    // Animation
    const duration = 5000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentRotation = totalRotation * easeOutQuart;
      
      setRotation(currentRotation);
      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('[RouletteWheel] Animation complete');
        setAnimationComplete(true);
        
        // Show winner for 2 seconds then proceed to results
        setTimeout(() => {
          console.log('[RouletteWheel] Proceeding to results');
          onSpinComplete();
        }, 2000);
      }
    };

    animate();
  }, [meals, winnerId, drawWheel, onSpinComplete]);

  // Redraw continuously to maintain the wheel state
  useEffect(() => {
    if (animationComplete) {
      drawWheel(rotation);
    }
  }, [animationComplete, rotation, drawWheel]);


  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Pointer at top */}
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-10">
          <div 
            className="w-0 h-0" 
            style={{
              borderLeft: '24px solid transparent',
              borderRight: '24px solid transparent',
              borderTop: '36px solid #EAB308',
            }}
          />
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="rounded-full"
            style={{
              filter: 'drop-shadow(0 0 60px rgba(249, 115, 22, 0.5))',
            }}
          />
          
          {/* Winner overlay when animation complete */}
          {animationComplete && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-green-500/95 text-white px-8 py-4 rounded-lg shadow-2xl transform -translate-y-32">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8" />
                  <div>
                    <div className="font-bold text-xl">Winner!</div>
                    <div className="text-sm">
                      {meals.find(m => m.id === winnerId)?.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
