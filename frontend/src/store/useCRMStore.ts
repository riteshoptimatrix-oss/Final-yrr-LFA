import { create } from 'zustand';
import { PipelineStage, Lead } from '@/types/index';

interface CRMState {
  // Pipeline state
  pipeline: {
    stages: {
      id: PipelineStage;
      label: string;
      order: number;
      leads: Lead[];
    }[];
  };
  
  // Selected lead
  selectedLeadId: string | null;
  
  // Follow-up state
  followUpReminders: {
    id: string;
    leadId: string;
    leadName: string;
    dueDate: string;
    completed: boolean;
  }[];
  
  // Activity state
  recentActivities: {
    id: string;
    leadId: string;
    type: string;
    description: string;
    timestamp: string;
  }[];
  
  // UI state
  isKanbanDragging: boolean;
  draggedLeadId: string | null;
  fromStage: PipelineStage | null;
  
  // Actions
  setPipeline: (pipeline: CRMState['pipeline']) => void;
  setSelectedLeadId: (leadId: string | null) => void;
  addFollowUpReminder: (reminder: CRMState['followUpReminders'][number]) => void;
  removeFollowUpReminder: (id: string) => void;
  markFollowUpCompleted: (id: string) => void;
  addActivity: (activity: CRMState['recentActivities'][number]) => void;
  setKanbanDragging: (isDragging: boolean) => void;
  setDraggedLeadId: (leadId: string | null) => void;
  setFromStage: (stage: PipelineStage | null) => void;
  
  // Pipeline actions
  moveLead: (leadId: string, fromStage: PipelineStage, toStage: PipelineStage) => void;
  updateLeadStage: (leadId: string, newStage: PipelineStage) => void;
}

export const useCRMStore = create<CRMState>(set => ({
  pipeline: {
    stages: [],
  },
  
  selectedLeadId: null,
  
  followUpReminders: [],
  
  recentActivities: [],
  
  isKanbanDragging: false,
  draggedLeadId: null,
  fromStage: null,
  
  setPipeline: pipeline => set({ pipeline }),
  
  setSelectedLeadId: leadId => set({ selectedLeadId: leadId }),
  
  addFollowUpReminder: reminder => set(state => ({
    followUpReminders: [...state.followUpReminders, reminder],
  })),
  
  removeFollowUpReminder: id => set(state => ({
    followUpReminders: state.followUpReminders.filter(r => r.id !== id),
  })),
  
  markFollowUpCompleted: id => set(state => ({
    followUpReminders: state.followUpReminders.map(r =>
      r.id === id ? { ...r, completed: true } : r
    ),
  })),
  
  addActivity: activity => set(state => ({
    recentActivities: [activity, ...state.recentActivities],
  })),
  
  setKanbanDragging: isDragging => set({ isKanbanDragging: isDragging }),
  
  setDraggedLeadId: leadId => set({ draggedLeadId: leadId }),
  
  setFromStage: stage => set({ fromStage: stage }),
  
  moveLead: (leadId, fromStage, toStage) =>
    set(state => {
      const newStages = state.pipeline.stages.map(stage => {
        if (stage.id === fromStage) {
          return {
            ...stage,
            leads: stage.leads.filter(lead => lead.id !== leadId),
          };
        }
        if (stage.id === toStage) {
          const fromStageObj = state.pipeline.stages.find(s => s.id === fromStage);
          const leadToMove = fromStageObj?.leads.find(l => l.id === leadId);
          return {
            ...stage,
            leads: leadToMove ? [...stage.leads, leadToMove] : stage.leads,
          };
        }
        return stage;
      });
      
      return {
        pipeline: { ...state.pipeline, stages: newStages },
        draggedLeadId: null,
        fromStage: null,
      };
    }),
  
  updateLeadStage: (leadId, newStage) =>
    set(state => ({
      pipeline: {
        ...state.pipeline,
        stages: state.pipeline.stages.map(stage => ({
          ...stage,
          leads: stage.leads.map(lead =>
            lead.id === leadId ? { ...lead, pipelineStage: newStage } : lead
          ),
        })),
      },
    })),
}));
