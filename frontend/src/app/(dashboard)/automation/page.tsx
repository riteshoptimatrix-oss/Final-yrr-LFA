"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BarChart3, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAreaAutomation } from "@/hooks/useAreaAutomation";
import type { StartAutomationRequest, AreaAutomationSession } from "@/services/area-automation.service";
import { AutomationStats } from "@/components/automation/AutomationStats";
import { AutomationFilters } from "@/components/automation/AutomationFilters";
import { AutomationTable } from "@/components/automation/AutomationTable";
import { AutomationCreateModal } from "@/components/automation/AutomationCreateModal";
import { AutomationDeleteModal } from "@/components/automation/AutomationDeleteModal";
import { AutomationEmptyState } from "@/components/automation/AutomationEmptyState";

export default function AutomationPage() {
  const {
    sessions,
    sessionsLoading,
    stats,
    statsLoading,
    startError,
    isStarting,
    isStopping,
    isDeleting,
    pauseAutomation,
    resumeAutomation,
    restartAutomation,
    deleteAutomation,
    duplicateAutomation,
    archiveAutomation,
    startAutomation,
    updateAutomation,
    filters,
    setFilters,
    refetchSessions,
  } = useAreaAutomation();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AreaAutomationSession | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editingSession, setEditingSession] = useState<AreaAutomationSession | null>(null);

  useEffect(() => {
    if (activeTab === "all") {
            setFilters((prev: Record<string, string | undefined>) => ({ ...prev, status: undefined }));
          } else {
            setFilters((prev: Record<string, string | undefined>) => ({ ...prev, status: activeTab }));
    }
  }, [activeTab, setFilters]);
  
  const handleCreate = useCallback(async (data: StartAutomationRequest) => {
    await startAutomation(data);
    setCreateModalOpen(false);
  }, [startAutomation]);

  const handleEdit = useCallback(async (data: StartAutomationRequest) => {
    if (editingSession) {
      await updateAutomation(editingSession.id, data);
      setEditModalOpen(false);
      setEditingSession(null);
    }
  }, [updateAutomation, editingSession]);

  const handleDelete = useCallback(async () => {
    if (selectedSession) {
      await deleteAutomation(selectedSession.id);
      setDeleteModalOpen(false);
      setSelectedSession(null);
    }
  }, [deleteAutomation, selectedSession]);

  const handleSaveDraft = useCallback(async (data: StartAutomationRequest) => {
    await startAutomation({ ...data, saveAsDraft: true });
    setCreateModalOpen(false);
  }, [startAutomation]);

  const openEdit = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setEditingSession(session);
      setEditModalOpen(true);
    }
  }, [sessions]);

  const openDelete = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setSelectedSession(session);
      setDeleteModalOpen(true);
    }
  }, [sessions]);

  const handlePause = useCallback(async (id: string) => {
    await pauseAutomation(id);
    refetchSessions();
  }, [pauseAutomation, refetchSessions]);

  const handleResume = useCallback(async (id: string) => {
    await resumeAutomation(id);
    refetchSessions();
  }, [resumeAutomation, refetchSessions]);

  const handleRestart = useCallback(async (id: string) => {
    await restartAutomation(id);
    refetchSessions();
  }, [restartAutomation, refetchSessions]);

  const handleDuplicate = useCallback(async (id: string) => {
    await duplicateAutomation(id);
    refetchSessions();
  }, [duplicateAutomation, refetchSessions]);

  const handleArchive = useCallback(async (id: string) => {
    await archiveAutomation(id);
    refetchSessions();
  }, [archiveAutomation, refetchSessions]);

  const handleView = useCallback((id: string) => {
    window.open(`/automation/${id}/monitor`, '_blank');
  }, []);

  const statusCounts = stats ? {
    all: stats.total,
    running: stats.running,
    paused: stats.paused,
    completed: stats.completed,
    failed: stats.failed,
    draft: stats.draft,
  } : {
    all: 0,
    running: 0,
    paused: 0,
    completed: 0,
    failed: 0,
    draft: 0,
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Leads Automation
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and monitor automated lead generation pipelines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refetchSessions}
                className="border-[#E5E7EB] bg-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="bg-[#2563EB] hover:bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <AutomationStats stats={stats} loading={statsLoading} />
        </motion.div>

        {startError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2"
          >
            <span className="font-medium">Error:</span> {startError}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-0 gap-1">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none rounded-lg px-4 py-2 text-sm"
                >
                  All ({statusCounts.all})
                </TabsTrigger>
                <TabsTrigger
                  value="running"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 py-2 text-sm"
                >
                  Running ({statusCounts.running})
                </TabsTrigger>
                <TabsTrigger
                  value="paused"
                  className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 rounded-lg px-4 py-2 text-sm"
                >
                  Paused ({statusCounts.paused})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 rounded-lg px-4 py-2 text-sm"
                >
                  Completed ({statusCounts.completed})
                </TabsTrigger>
                <TabsTrigger
                  value="failed"
                  className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 rounded-lg px-4 py-2 text-sm"
                >
                  Failed ({statusCounts.failed})
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 rounded-lg px-4 py-2 text-sm"
                >
                  Draft ({statusCounts.draft})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-6"
        >
          <AutomationFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {sessionsLoading ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8">
              <div className="flex items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading automations...</span>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <AutomationEmptyState onCreate={() => setCreateModalOpen(true)} />
          ) : (
            <AutomationTable
              sessions={sessions}
              loading={sessionsLoading}
              onView={handleView}
              onEdit={openEdit}
              onPause={handlePause}
              onResume={handleResume}
              onRestart={handleRestart}
              onDuplicate={handleDuplicate}
              onDelete={openDelete}
              onArchive={handleArchive}
            />
          )}
        </motion.div>
      </div>

      <AutomationCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreate}
        onSaveDraft={handleSaveDraft}
        loading={isStarting}
        mode="create"
      />

      <AutomationCreateModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingSession(null);
        }}
        onSubmit={handleEdit}
        loading={isStarting}
        mode="edit"
        initialData={editingSession ? {
          name: editingSession.name,
          businessTypes: editingSession.businessTypes,
          country: (editingSession as { country?: string }).country,
          state: editingSession.state,
          cities: editingSession.cities,
          sources: editingSession.sources,
          maxLeads: editingSession.maxLeads,
          concurrency: editingSession.concurrency,
          retryEnabled: editingSession.retryEnabled,
          dedupEnabled: editingSession.dedupEnabled,
          aiAuditEnabled: editingSession.aiAuditEnabled,
          autoOutreach: editingSession.autoOutreach,
          autoReport: editingSession.autoReport,
          autoWhatsApp: editingSession.autoWhatsApp,
          frequency: editingSession.frequency,
          schedule: editingSession.schedule,
        } : undefined}
      />

      <AutomationDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setSelectedSession(null);
        }}
        onConfirm={handleDelete}
        loading={isDeleting}
        automationName={selectedSession?.name || selectedSession?.businessTypes?.[0]}
      />
    </div>
  );
}
