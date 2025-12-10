'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, Sparkles } from 'lucide-react'
import { SemaphoreSummary } from '../dashboard/SemaphoreSummary'

interface CalorieProgressDisplayProps {
  consumed: number
  goal: number
  loading?: boolean
}

export function CalorieProgressDisplay({ consumed, goal, loading }: CalorieProgressDisplayProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-32 h-5 bg-muted animate-pulse rounded"></div>
              <div className="w-48 h-4 bg-muted/70 animate-pulse rounded"></div>
            </div>
            <div className="w-16 h-8 bg-muted animate-pulse rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full h-3 bg-muted animate-pulse rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-muted animate-pulse rounded"></div>
              <div className="h-16 bg-muted animate-pulse rounded"></div>
              <div className="h-16 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const percentage = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0
  const isAtGoal = consumed >= goal

  const getStatusMessage = () => {
    if (percentage === 0) return 'Start your nutritious day 🌅'
    if (percentage <= 25) return 'Good start to the day 👍'
    if (percentage <= 50) return 'Steady progress ⚡'
    if (percentage <= 80) return 'Getting close to your goal 🎯'
    if (percentage <= 100) return 'Very close to your target 🔥'
    return 'Goal achieved! 🎉'
  }

  const getBadgeVariant = () => {
    if (percentage <= 100) return 'secondary'
    return 'default'
  }

  const excess = Math.max(0, consumed - goal)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Nutritional Progress
            </CardTitle>
            <CardDescription className="mt-1">
              {getStatusMessage()}
            </CardDescription>
          </div>
          <Badge variant={getBadgeVariant()} className="text-sm font-semibold">
            {Math.round(percentage)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Barra de progreso principal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Consumed today</span>
            <span className="font-medium">
              {consumed.toLocaleString()} / {goal.toLocaleString()} kcal
            </span>
          </div>
          
          <Progress 
            value={Math.min(100, percentage)} 
            className="h-3"
          />
          
          {isAtGoal && excess > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Additional energy</span>
              <span className="text-purple-600 font-medium">
                +{excess.toLocaleString()} kcal
              </span>
            </div>
          )}
        </div>

        {/* Estadísticas en grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">
              {consumed.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Consumed
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">
              {goal.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Your Goal
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              {isAtGoal ? (
                <span className="text-purple-600">
                  +{excess.toLocaleString()}
                </span>
              ) : (
                (goal - consumed).toLocaleString()
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {isAtGoal ? 'Extra' : 'Remaining'}
            </div>
          </div>
        </div>

        {/* Mensaje motivacional */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {isAtGoal 
                  ? 'Excellent! You\'ve reached your nutritional goal for today'
                  : `You\'re on the right track towards your daily goal`
                }
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {isAtGoal 
                  ? 'The extra energy can be perfect for your activities'
                  : 'Each meal brings you closer to balanced nutrition'
                }
              </p>
            </div>
          </div>
        </div>

                          {/* Nutritional Progress Card */}
          <SemaphoreSummary />
      </CardContent>
    </Card>
  )
}