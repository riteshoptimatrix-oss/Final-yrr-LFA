"use client"

import { motion } from "framer-motion"
import { Bot, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AutomationEmptyStateProps {
  onCreate?: () => void
  title?: string
  description?: string
}

export function AutomationEmptyState({
  onCreate,
  title = "No automations yet",
  description = "Create your first automation to start generating leads automatically",
}: AutomationEmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Bot className="h-10 w-10 text-blue-500" />
      </motion.div>

      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="max-w-md text-center text-sm text-gray-500">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {onCreate && (
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}
