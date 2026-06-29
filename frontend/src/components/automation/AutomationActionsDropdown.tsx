'use client'

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Pencil, Pause, Play, RotateCcw, Copy, Archive, Trash2 } from "lucide-react"

interface AutomationActionsDropdownProps {
  sessionId: string
  status: string
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onRestart?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
}

function AutomationActionsDropdown({
  sessionId,
  status,
  onView,
  onEdit,
  onPause,
  onResume,
  onRestart,
  onDuplicate,
  onDelete,
  onArchive,
}: AutomationActionsDropdownProps) {
  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isTerminal = status === 'completed' || status === 'failed' || status === 'archived'
  const isArchived = status === 'archived'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={16} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onView?.(sessionId)}>
          <Eye size={16} className="mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(sessionId)}>
          <Pencil size={16} className="mr-2" />
          Edit
        </DropdownMenuItem>
        {isRunning && (
          <DropdownMenuItem onClick={() => onPause?.(sessionId)}>
            <Pause size={16} className="mr-2" />
            Pause
          </DropdownMenuItem>
        )}
        {isPaused && (
          <DropdownMenuItem onClick={() => onResume?.(sessionId)}>
            <Play size={16} className="mr-2" />
            Resume
          </DropdownMenuItem>
        )}
        {isTerminal && (
          <DropdownMenuItem onClick={() => onRestart?.(sessionId)}>
            <RotateCcw size={16} className="mr-2" />
            Restart
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDuplicate?.(sessionId)}>
          <Copy size={16} className="mr-2" />
          Duplicate
        </DropdownMenuItem>
        {!isArchived && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onArchive?.(sessionId)}>
              <Archive size={16} className="mr-2" />
              Archive
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete?.(sessionId)} className="text-red-600 focus:text-red-600">
          <Trash2 size={16} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AutomationActionsDropdown }
