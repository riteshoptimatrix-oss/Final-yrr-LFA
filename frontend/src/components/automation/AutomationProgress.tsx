'use client'

import { motion } from "framer-motion"
import { cn } from "@utils/cn"

interface AutomationProgressProps {
  completed: number
  total: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

function AutomationProgress({
  completed,
  total,
  size = 'md',
  showLabel = true,
  className,
}: AutomationProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-gray-100', sizeMap[size])}>
        <motion.div
          className={cn(
            'rounded-full bg-gradient-to-r from-blue-500 to-blue-600',
            sizeMap[size]
          )}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-gray-500">
          {completed} / {total} areas completed
        </p>
      )}
    </div>
  )
}

export { AutomationProgress }
