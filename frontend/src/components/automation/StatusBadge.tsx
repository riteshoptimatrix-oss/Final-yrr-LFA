'use client'

import { Badge } from "@/components/ui/badge"
import { cn } from "@utils/cn"

type AutomationStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'archived' | 'pending' | 'skipped'

const statusConfig: Record<AutomationStatus, { bg: string; text: string }> = {
  running: { bg: 'bg-[#2563EB]', text: 'white' },
  completed: { bg: 'bg-[#16A34A]', text: 'white' },
  failed: { bg: 'bg-[#DC2626]', text: 'white' },
  paused: { bg: 'bg-[#F59E0B]', text: 'white' },
  draft: { bg: 'bg-[#6B7280]', text: 'white' },
  archived: { bg: 'bg-[#64748B]', text: 'white' },
  pending: { bg: 'bg-[#9CA3AF]', text: 'white' },
  skipped: { bg: 'bg-[#D97706]', text: 'white' },
}

const sizeConfig = {
  sm: { padding: 'px-1.5 py-0', fontSize: 'text-[10px]' },
  md: { padding: 'px-2.5 py-0.5', fontSize: 'text-xs' },
  lg: { padding: 'px-3 py-1', fontSize: 'text-sm' },
}

interface StatusBadgeProps {
  status: AutomationStatus
  variant?: 'default' | 'dot'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function StatusBadge({ status, variant = 'default', size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizes = sizeConfig[size]

  if (variant === 'dot') {
    return (
      <span
        className={cn('inline-block rounded-full', sizes.fontSize, className)}
        style={{ color: config.bg.replace('bg-[', '').replace(']', '') }}
      >
        ●
      </span>
    )
  }

  return (
    <Badge
      className={cn(
        'border-0 font-medium capitalize',
        config.bg,
        `text-${config.text}`,
        sizes.padding,
        sizes.fontSize,
        className
      )}
    >
      <span className="mr-1">●</span>
      {status}
    </Badge>
  )
}

export { StatusBadge }
