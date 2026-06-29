import { Lead } from '../models/Lead';
import { logger } from '../utils/logger';
import { websiteIntelligenceEngine } from './website-intelligence-engine.service';
import { businessEmailDiscoveryService } from './business-email-discovery.service';
import { responsiveAuditService } from './responsive-audit.service';
import { businessIntelligenceService } from './business-intelligence.service';
import { salesIntelligenceService } from './sales-intelligence.service';
import { outreachService } from './outreach.service';
import { reportService } from '../modules/reports/report.service';
import { aiAnalysisEngine } from './ai-analysis-engine.service';
import {
  emitLeadEnrichmentStarted,
  emitLeadEnrichmentStep,
  emitLeadEnrichmentCompleted,
  emitLeadEnrichmentFailed,
} from '../modules/automation-monitor/socket-manager';
import crypto from 'crypto';

interface EnrichmentStep {
  id: string;
  name: string;
  run: (leadId: string) => Promise<boolean>;
}

const ENRICHMENT_STEPS: EnrichmentStep[] = [
  {
    id: 'website_intelligence',
    name: 'Website Intelligence',
    run: async (leadId: string) => {
      const lead = await Lead.findById(leadId).select('hasWebsite website companyName').lean() as Record<string, unknown> | null;
      if (!lead || !lead.hasWebsite || !lead.website) return false;
      await websiteIntelligenceEngine.processLead(leadId, lead.website as string);
      return true;
    },
  },
  {
    id: 'email_discovery',
    name: 'Email Discovery',
    run: async (leadId: string) => {
      const lead = await Lead.findById(leadId).select('hasWebsite website').lean() as Record<string, unknown> | null;
      if (!lead || !lead.hasWebsite || !lead.website) return false;
      const result = await businessEmailDiscoveryService.discoverEmailsForLead(leadId);
      return result.success;
    },
  },
  {
    id: 'responsive_audit',
    name: 'Responsive Audit',
    run: async (leadId: string) => {
      const result = await responsiveAuditService.auditLead(leadId);
      return result !== null;
    },
  },
  {
    id: 'business_intelligence',
    name: 'Business Intelligence',
    run: async (leadId: string) => {
      const result = await businessIntelligenceService.analyzeLead(leadId);
      return result !== null;
    },
  },
  {
    id: 'sales_intelligence',
    name: 'Sales Intelligence',
    run: async (leadId: string) => {
      const result = await salesIntelligenceService.analyzeLead(leadId);
      return result !== null;
    },
  },
  {
    id: 'outreach',
    name: 'Outreach Generation',
    run: async (leadId: string) => {
      await outreachService.generateOutreachForLead(leadId);
      return true;
    },
  },
  {
    id: 'report',
    name: 'Report Generation',
    run: async (leadId: string) => {
      const result = await reportService.generateReport(leadId);
      return result.success;
    },
  },
  {
    id: 'ai_analysis',
    name: 'AI Analysis',
    run: async (leadId: string) => {
      aiAnalysisEngine.enqueueAnalysis(leadId);
      return true;
    },
  },
];

export class LeadEnrichmentPipeline {
  private activeEnrichments = new Set<string>();
  private maxConcurrent = 5;

  async enqueueLead(leadId: string, force = false): Promise<void> {
    if (this.activeEnrichments.has(leadId)) {
      logger.debug(`[Enrichment] Lead ${leadId} already being enriched, skipping`);
      return;
    }

    const lead = await Lead.findById(leadId)
      .select('enrichmentStatus website hasWebsite enrichmentCompletedAt enrichmentError')
      .lean() as Record<string, unknown> | null;

    if (!lead) {
      logger.warn({ leadId }, '[Enrichment] Lead not found, skipping');
      return;
    }

    if (lead.enrichmentStatus === 'completed' && !force) {
      logger.debug(`[Enrichment] Lead ${leadId} already enriched, skipping`);
      return;
    }

    this.activeEnrichments.add(leadId);

    setImmediate(() => {
      this.runPipeline(leadId, force).finally(() => {
        this.activeEnrichments.delete(leadId);
      });
    });
  }

  enqueueMultiple(leadIds: string[], force = false): void {
    for (const leadId of leadIds) {
      if (this.activeEnrichments.size >= this.maxConcurrent) {
        logger.debug(`[Enrichment] Max concurrent enrichments reached (${this.maxConcurrent}), delaying ${leadId}`);
        setImmediate(() => this.enqueueLead(leadId, force));
      } else {
        this.enqueueLead(leadId, force);
      }
    }
  }

  private async runPipeline(leadId: string, _force: boolean): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    let completedSteps = 0;
    const totalSteps = ENRICHMENT_STEPS.length;

    try {
      await Lead.findByIdAndUpdate(leadId, {
        $set: {
          enrichmentStatus: 'running',
          enrichmentStartedAt: new Date(),
          enrichmentCompletedAt: null,
          enrichmentError: null,
          enrichmentProgress: 0,
          enrichmentCurrentStep: 'Starting enrichment',
        },
      });

      emitLeadEnrichmentStarted(leadId);

      for (let i = 0; i < totalSteps; i++) {
        const step = ENRICHMENT_STEPS[i];
        const progress = Math.round(((i) / totalSteps) * 100);

        await Lead.findByIdAndUpdate(leadId, {
          $set: {
            enrichmentCurrentStep: step.name,
            enrichmentProgress: progress,
          },
        });

        emitLeadEnrichmentStep(leadId, {
          step: step.id,
          stepIndex: i,
          totalSteps,
          progress,
          status: 'running',
        });

        try {
          logger.info(`[Enrichment] Step ${i + 1}/${totalSteps}: ${step.name} for lead ${leadId}`);
          const success = await step.run(leadId);

          if (success) {
            completedSteps++;
            emitLeadEnrichmentStep(leadId, {
              step: step.id,
              stepIndex: i,
              totalSteps,
              progress: Math.round(((i + 1) / totalSteps) * 100),
              status: 'completed',
            });
            logger.info(`[Enrichment] Step ${i + 1}/${totalSteps}: ${step.name} completed for lead ${leadId}`);
          } else {
            emitLeadEnrichmentStep(leadId, {
              step: step.id,
              stepIndex: i,
              totalSteps,
              progress: Math.round(((i + 1) / totalSteps) * 100),
              status: 'skipped',
            });
            logger.info(`[Enrichment] Step ${i + 1}/${totalSteps}: ${step.name} skipped for lead ${leadId}`);
          }
        } catch (stepErr: unknown) {
          const stepMsg = stepErr instanceof Error ? stepErr.message : String(stepErr);
          errors.push(`Step ${i + 1} (${step.name}): ${stepMsg}`);
          completedSteps++;

          emitLeadEnrichmentStep(leadId, {
            step: step.id,
            stepIndex: i,
            totalSteps,
            progress: Math.round(((i + 1) / totalSteps) * 100),
            status: 'failed',
            error: stepMsg,
          });

          logger.warn({ err: stepMsg, leadId, step: step.name }, `[Enrichment] Step failed (continuing): ${step.name}`);
        }
      }

      const duration = Date.now() - startTime;
      const finalStatus = errors.length === totalSteps ? 'failed' : 'completed';
      const finalProgress = 100;

      const websiteDoc = await Lead.findById(leadId).select('website').lean() as Record<string, unknown> | null;
      const website = websiteDoc?.website as string | undefined;
      const aiWebsiteHash = website ? this.computeWebsiteHash(website) : '';

      await Lead.findByIdAndUpdate(leadId, {
        $set: {
          enrichmentStatus: finalStatus,
          enrichmentCompletedAt: new Date(),
          enrichmentProgress: finalProgress,
          enrichmentCurrentStep: errors.length > 0 ? 'Completed with errors' : 'Completed',
          aiWebsiteHash: aiWebsiteHash || undefined,
        },
      });

      for (const step of ['responsiveAuditReady', 'intelligenceReady', 'salesAIReady', 'outreachReady', 'reportReady'] as const) {
        try {
          const existing = await Lead.findById(leadId).select(step).lean() as Record<string, unknown> | null;
          if (existing && (existing[step] === true || existing[step] === false)) {
            continue;
          }
        } catch {
          // ignore
        }
      }

      if (finalStatus === 'completed') {
        emitLeadEnrichmentCompleted(leadId, { duration, totalSteps, errors: errors.length });
      } else {
        emitLeadEnrichmentFailed(leadId, {
          error: errors.join('; '),
          duration,
          completedSteps,
          totalSteps,
        });
      }

      logger.info({
        leadId,
        duration,
        totalSteps,
        completedSteps,
        errors: errors.length,
        status: finalStatus,
      }, '[Enrichment] Pipeline finished');
    } catch (pipelineErr: unknown) {
      const errMsg = pipelineErr instanceof Error ? pipelineErr.message : String(pipelineErr);
      logger.error({ err: errMsg, leadId }, '[Enrichment] Fatal pipeline error');

      try {
        await Lead.findByIdAndUpdate(leadId, {
          $set: {
            enrichmentStatus: 'failed',
            enrichmentCompletedAt: new Date(),
            enrichmentProgress: Math.round((completedSteps / totalSteps) * 100),
            enrichmentError: errMsg,
          },
        });
      } catch {
        // ignore error during error handling
      }

      emitLeadEnrichmentFailed(leadId, {
        error: errMsg,
        duration: Date.now() - startTime,
        completedSteps,
        totalSteps,
      });
    }
  }

  getStatus(): { activeCount: number; maxConcurrent: number } {
    return {
      activeCount: this.activeEnrichments.size,
      maxConcurrent: this.maxConcurrent,
    };
  }

  private computeWebsiteHash(website: string | undefined): string {
    if (!website) return '';
    return crypto.createHash('md5').update(website.toLowerCase().trim()).digest('hex');
  }
}

export const leadEnrichmentPipeline = new LeadEnrichmentPipeline();
