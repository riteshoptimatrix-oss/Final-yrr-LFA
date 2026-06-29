"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { Bot, Play, CheckCircle, XCircle, Pause, FileEdit, Users } from "lucide-react"
import type { AutomationStats } from "@/services/area-automation.service"

const statCards = [
  { key: "total", label: "Total Automations", icon: Bot, color: "#2563EB" },
  { key: "running", label: "Running", icon: Play, color: "#2563EB" },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "#16A34A" },
  { key: "failed", label: "Failed", icon: XCircle, color: "#DC2626" },
  { key: "paused", label: "Paused", icon: Pause, color: "#F59E0B" },
  { key: "draft", label: "Draft", icon: FileEdit, color: "#6B7280" },
  { key: "totalLeads", label: "Total Leads", icon: Users, color: "#8B5CF6" },
]

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    prevTarget.current = value
    const start = prevTarget.current
    const startTime = performance.now()

    if (start === target) {
      setValue(target)
      return
    }

    const raf = requestAnimationFrame(function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = Math.round(start + (target - start) * progress)
      setValue(current)
      if (progress < 1) requestAnimationFrame(tick)
    })

    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-7 w-16 bg-gray-200 rounded mt-2" />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  index,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  index: number
}) {
  const count = useCountUp(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="bg-white border border-[#E5E7EB] rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}14` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-sm text-gray-500 truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {count}
      </p>
    </motion.div>
  )
}

interface AutomationStatsProps {
  stats: AutomationStats | null
  loading?: boolean
}

export function AutomationStats({ stats, loading }: AutomationStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const values: Record<string, number> = {
    total: stats.total,
    running: stats.running,
    completed: stats.completed,
    failed: stats.failed,
    paused: stats.paused,
    draft: stats.draft,
    totalLeads: stats.totalLeads,
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
    >
      {statCards.map((card, i) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={values[card.key]}
          icon={card.icon}
          color={card.color}
          index={i}
        />
      ))}
    </motion.div>
  )
}
