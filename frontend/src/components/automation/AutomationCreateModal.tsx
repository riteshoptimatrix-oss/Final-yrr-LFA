"use client"

import { useState, useEffect, useRef, useMemo, type KeyboardEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Settings, Globe, Zap } from "lucide-react"
import type { StartAutomationRequest } from "@/services/area-automation.service"
import { LocationSelector } from "@/components/location/LocationSelector"
import type { LocationSelection } from "@/components/location/LocationSelector"
import type { GeographyCountry, GeographyState, GeographyCity } from "@/types/geography"
import { getAllCountries, getStatesOfCountry, getCitiesOfState } from "@/services/geography.service"

const SOURCES = [
  { value: "google-maps", label: "Google Maps" },
  { value: "justdial", label: "Justdial" },
  { value: "indiamart", label: "IndiaMART" },
] as const

const FREQUENCIES = ["once", "hourly", "daily", "weekly", "monthly"] as const

interface AutomationCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: StartAutomationRequest) => void
  onSaveDraft?: (data: StartAutomationRequest) => void
  loading?: boolean
  initialData?: Partial<StartAutomationRequest>
  mode?: "create" | "edit"
}

function lookupCountry(name?: string): GeographyCountry | null {
  if (!name) return null
  const all = getAllCountries()
  return all.find(c => c.name.toLowerCase() === name.toLowerCase()) || null
}

function lookupState(country: GeographyCountry | null, name?: string): GeographyState | null {
  if (!name || !country) return null
  const states = getStatesOfCountry(country.iso2)
  return states.find(s => s.name.toLowerCase() === name.toLowerCase()) || null
}

function lookupCity(country: GeographyCountry | null, state: GeographyState | null, name?: string): GeographyCity | null {
  if (!name || !country || !state) return null
  const cities = getCitiesOfState(country.iso2, state.isoCode)
  return cities.find(c => c.name.toLowerCase() === name.toLowerCase()) || null
}

function initialDataToSelection(data?: Partial<StartAutomationRequest>): LocationSelection {
  if (!data) return { country: null, state: null, city: null, area: null }
  const country = lookupCountry(data.country)
  const state = lookupState(country, data.state)
  const cityName = data.cities?.[0]
  const city = lookupCity(country, state, cityName)
  return { country, state, city, area: null }
}

export function AutomationCreateModal({
  open,
  onOpenChange,
  onSubmit,
  onSaveDraft,
  loading = false,
  initialData,
  mode = "create",
}: AutomationCreateModalProps) {
  const [name, setName] = useState("")
  const [businessTypes, setBusinessTypes] = useState<string[]>([])
  const [businessTypeInput, setBusinessTypeInput] = useState("")
  const [location, setLocation] = useState<LocationSelection>({ country: null, state: null, city: null, area: null })
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [maxLeads, setMaxLeads] = useState(0)
  const [concurrency, setConcurrency] = useState(2)
  const [retryFailed, setRetryFailed] = useState(true)
  const [deduplication, setDeduplication] = useState(true)
  const [aiAudit, setAiAudit] = useState(false)
  const [autoOutreach, setAutoOutreach] = useState(false)
  const [autoReportGeneration, setAutoReportGeneration] = useState(false)
  const [autoWhatsAppPrep, setAutoWhatsAppPrep] = useState(false)
  const [frequency, setFrequency] = useState("once")
  const [schedule, setSchedule] = useState("")

  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      if (initialData.businessTypes) setBusinessTypes(initialData.businessTypes)
      if (initialData.sources) setSelectedSources(initialData.sources)
      if (initialData.maxLeads !== undefined) setMaxLeads(initialData.maxLeads)
      if (initialData.concurrency !== undefined) setConcurrency(initialData.concurrency)
      setLocation(initialDataToSelection(initialData))
    }
  }, [initialData])

  useEffect(() => {
    if (!open) {
      setName("")
      setBusinessTypes([])
      setBusinessTypeInput("")
      setLocation({ country: null, state: null, city: null, area: null })
      setSelectedSources([])
      setMaxLeads(0)
      setConcurrency(2)
      setRetryFailed(true)
      setDeduplication(true)
      setAiAudit(false)
      setAutoOutreach(false)
      setAutoReportGeneration(false)
      setAutoWhatsAppPrep(false)
      setFrequency("once")
      setSchedule("")
    }
  }, [open])

  const addBusinessType = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !businessTypes.includes(trimmed)) {
      setBusinessTypes([...businessTypes, trimmed])
    }
    setBusinessTypeInput("")
  }

  const removeBusinessType = (index: number) => {
    setBusinessTypes(businessTypes.filter((_, i) => i !== index))
  }

  const handleBusinessTypeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addBusinessType(businessTypeInput)
    }
  }

  const handleBusinessTypePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    const items = pasted.split(/[,]+/).map(s => s.trim()).filter(Boolean)
    const newItems = items.filter(item => !businessTypes.includes(item))
    if (newItems.length > 0) {
      setBusinessTypes([...businessTypes, ...newItems])
    }
  }

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    )
  }

  const buildFormData = (): StartAutomationRequest => ({
    name: name || undefined,
    businessTypes,
    country: location.country?.name || undefined,
    state: location.state?.name || "",
    cities: location.city?.name ? [location.city.name] : [],
    sources: selectedSources,
    maxLeads: maxLeads || undefined,
    concurrency,
    retryEnabled: retryFailed,
    dedupEnabled: deduplication,
    aiAuditEnabled: aiAudit,
    autoOutreach,
    autoReport: autoReportGeneration,
    autoWhatsApp: autoWhatsAppPrep,
    frequency,
    schedule: schedule || undefined,
  })

  const handleSubmit = () => {
    onSubmit(buildFormData())
  }

  const handleSaveDraft = () => {
    onSaveDraft?.({ ...buildFormData(), saveAsDraft: true })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Automation" : "Edit Automation"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Configure automated lead scraping for a country, state, and city."
              : "Modify the settings for this automation."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic" className="gap-2">
              <Settings className="h-4 w-4" />
              Basic Settings
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Zap className="h-4 w-4" />
              Advanced Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="automation-name">Automation Name</Label>
              <Input
                id="automation-name"
                placeholder="Enter automation name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Business Types</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {businessTypes.map((type, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeBusinessType(index)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  ref={tagInputRef}
                  placeholder="Type a business type and press Enter"
                  value={businessTypeInput}
                  onChange={e => setBusinessTypeInput(e.target.value)}
                  onKeyDown={handleBusinessTypeKeyDown}
                  onPaste={handleBusinessTypePaste}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => addBusinessType(businessTypeInput)}
                  disabled={!businessTypeInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter or paste comma-separated values to add multiple business types
              </p>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <LocationSelector
                value={location}
                onChange={setLocation}
                showCountry={true}
                showState={true}
                showCity={true}
                showArea={false}
              />
            </div>

            <div className="space-y-2">
              <Label>Sources</Label>
              <div className="flex flex-wrap gap-3">
                {SOURCES.map(source => {
                  const isActive = selectedSources.includes(source.value)
                  return (
                    <button
                      key={source.value}
                      type="button"
                      onClick={() => toggleSource(source.value)}
                      className={`
                        inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                        transition-all duration-200 border
                        ${
                          isActive
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                        }
                      `}
                    >
                      <Globe className="h-4 w-4" />
                      {source.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-leads">Max Leads (0 = unlimited)</Label>
                <Input
                  id="max-leads"
                  type="number"
                  min={0}
                  placeholder="0 = unlimited extraction"
                  value={maxLeads}
                  onChange={e => setMaxLeads(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 to extract every available business from Google Maps
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="concurrency">Concurrency</Label>
                <Input
                  id="concurrency"
                  type="number"
                  min={1}
                  placeholder="Concurrency"
                  value={concurrency}
                  onChange={e => setConcurrency(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  id="retry-failed"
                  type="checkbox"
                  checked={retryFailed}
                  onChange={e => setRetryFailed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="retry-failed" className="cursor-pointer">
                  Retry Failed
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="deduplication"
                  type="checkbox"
                  checked={deduplication}
                  onChange={e => setDeduplication(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="deduplication" className="cursor-pointer">
                  Deduplication
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="ai-audit"
                  type="checkbox"
                  checked={aiAudit}
                  onChange={e => setAiAudit(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="ai-audit" className="cursor-pointer">
                  AI Audit
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="auto-outreach"
                  type="checkbox"
                  checked={autoOutreach}
                  onChange={e => setAutoOutreach(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="auto-outreach" className="cursor-pointer">
                  Auto Outreach
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="auto-report-generation"
                  type="checkbox"
                  checked={autoReportGeneration}
                  onChange={e => setAutoReportGeneration(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="auto-report-generation" className="cursor-pointer">
                  Auto Report Generation
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="auto-whatsapp-prep"
                  type="checkbox"
                  checked={autoWhatsAppPrep}
                  onChange={e => setAutoWhatsAppPrep(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="auto-whatsapp-prep" className="cursor-pointer">
                  Auto WhatsApp Prep
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(f => (
                      <SelectItem key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Input
                  id="schedule"
                  placeholder="Cron expression or time"
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>Save as Draft</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={mode === "create" ? "default" : "default"}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {mode === "create" ? "Starting..." : "Saving..."}
              </span>
            ) : mode === "create" ? (
              "Start Automation"
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}