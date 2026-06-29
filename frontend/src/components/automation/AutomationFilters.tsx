"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface AutomationFiltersProps {
  filters: {
    status?: string
    search?: string
    source?: string
    state?: string
    sortBy?: string
    sortOrder?: string
  }
  onFilterChange: (filters: any) => void
}

export function AutomationFilters({ filters, onFilterChange }: AutomationFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchValue(filters.search || "")
  }, [filters.search])

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onFilterChange({ ...filters, search: value || undefined })
      }, 300)
    },
    [filters, onFilterChange]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const updateFilter = (key: string, value: string | undefined) => {
    onFilterChange({ ...filters, [key]: value || undefined })
  }

  const updateFilters = (updates: Record<string, string | undefined>) => {
    onFilterChange({ ...filters, ...updates })
  }

  const clearFilters = () => {
    setSearchValue("")
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "")

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search automations..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              debouncedSearch(e.target.value)
            }}
            className="pl-9 rounded-lg border-[#E5E7EB]"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Status</span>
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => updateFilter("status", val === "all" ? undefined : val)}
            >
              <SelectTrigger className="w-[140px] rounded-lg border-[#E5E7EB]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Source</span>
            <Select
              value={filters.source || "all"}
              onValueChange={(val) => updateFilter("source", val === "all" ? undefined : val)}
            >
              <SelectTrigger className="w-[140px] rounded-lg border-[#E5E7EB]">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="google-maps">Google Maps</SelectItem>
                <SelectItem value="justdial">Justdial</SelectItem>
                <SelectItem value="indiamart">IndiaMart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Sort By</span>
            <Select
              value={filters.sortBy ? `${filters.sortBy}_${filters.sortOrder || "desc"}` : "newest_desc"}
              onValueChange={(val) => {
                const [sortBy, sortOrder] = val.split("_")
                updateFilters({
                  sortBy: sortBy === "newest" ? undefined : sortBy,
                  sortOrder,
                })
              }}
            >
              <SelectTrigger className="w-[150px] rounded-lg border-[#E5E7EB]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest_desc">Newest</SelectItem>
                <SelectItem value="newest_asc">Oldest</SelectItem>
                <SelectItem value="totalLeads_desc">Highest Leads</SelectItem>
                <SelectItem value="status_asc">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
