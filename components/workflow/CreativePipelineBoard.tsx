import React, { useState } from 'react';
import {
  Deliverable,
  CreativeWorkflowStage,
  WORKFLOW_STAGE_METADATA,
  User,
} from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { Badge } from '../common/Badge';
import { ArrowRight, CheckCircle2, AlertCircle, Clock, Eye, Video, FileText, Plus } from 'lucide-react';

interface CreativePipelineBoardProps {
  deliverables: Deliverable[];
  currentUser: User;
  onAdvanceStage: (deliverableId: string, nextStage: CreativeWorkflowStage) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  onCreateDeliverable?: () => void;
}

export function CreativePipelineBoard({
  deliverables,
  currentUser,
  onAdvanceStage,
  onSelectDeliverable,
  onCreateDeliverable,
}: CreativePipelineBoardProps) {
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const canManage = hasFullAdminAccess(currentUser);

  const stages: CreativeWorkflowStage[] = [
    'content_planning',
    'scriptwriting',
    'internal_script_review',
    'client_script_approval',
    'video_editing',
    'internal_video_review',
    'client_video_approval',
    'revisions',
    'scheduling',
    'publishing_or_delivery',
  ];

  const uniqueClients = Array.from(new Set(deliverables.map((d) => d.clientName)));

  const filteredDeliverables = deliverables.filter((d) => {
    if (selectedClientFilter !== 'all' && d.clientName !== selectedClientFilter) return false;
    return true;
  });

  const getDeliverablesInStage = (stage: CreativeWorkflowStage) =>
    filteredDeliverables.filter((d) => d.stage === stage && d.status !== 'cancelled');

  return (
    <div className="space-y-4">
      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            10-Stage Creative Production Pipeline
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            End-to-end creative lifecycle tracking from content ideation to published client delivery.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black"
          >
            <option value="all">All Clients</option>
            {uniqueClients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>

          {canManage && onCreateDeliverable && (
            <button
              onClick={onCreateDeliverable}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deliverable</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scrolling Kanban Columns */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[2800px]">
          {stages.map((stageKey, idx) => {
            const meta = WORKFLOW_STAGE_METADATA[stageKey];
            const items = getDeliverablesInStage(stageKey);
            const isFinalStage = stageKey === 'publishing_or_delivery';

            return (
              <div
                key={stageKey}
                className="w-72 bg-neutral-100/70 border border-neutral-200/80 rounded-xl flex flex-col max-h-[750px] shadow-2xs shrink-0"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-stone-200/90 bg-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-100 border border-rose-800/80 text-[10px] font-bold flex items-center justify-center">
                        {meta.step}
                      </span>
                      <h3 className="text-xs font-bold text-stone-900 tracking-tight truncate max-w-[170px]">
                        {meta.label}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200">
                      {items.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">{meta.description}</p>
                </div>

                {/* Cards List */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {items.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-neutral-400 border border-dashed border-neutral-200 rounded-lg">
                      No deliverables in this stage
                    </div>
                  ) : (
                    items.map((item) => {
                      const nextStage = stages[idx + 1];
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg p-3 border border-neutral-200 hover:border-neutral-300 shadow-2xs hover:shadow-xs transition-all text-left group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 truncate max-w-[130px]">
                              {item.clientName}
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-400">
                              v{item.currentVersion}
                            </span>
                          </div>

                          <h4
                            onClick={() => onSelectDeliverable(item)}
                            className="text-xs font-semibold text-neutral-900 line-clamp-2 hover:text-black hover:underline cursor-pointer"
                          >
                            {item.title}
                          </h4>

                          <div className="mt-2 text-[11px] text-neutral-500 flex items-center gap-2">
                            <span className="capitalize">{item.type}</span>
                            <span>•</span>
                            <span className="truncate">{item.assignedEmployeeName}</span>
                          </div>

                          {/* Specific Stage Badges */}
                          <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                            {item.status === 'client_review' ? (
                              <Badge variant="purple" size="sm">
                                Pending Client Approval
                              </Badge>
                            ) : item.status === 'revision_requested' ? (
                              <Badge variant="rose" size="sm">
                                Revision Needed
                              </Badge>
                            ) : item.isCountedTowardsCommitment ? (
                              <Badge variant="emerald" size="sm">
                                ✓ Counted Towards Target
                              </Badge>
                            ) : (
                              <span className="text-neutral-400 text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Due {item.deadline}
                              </span>
                            )}

                            <button
                              onClick={() => onSelectDeliverable(item)}
                              className="text-neutral-400 hover:text-neutral-700 p-1"
                              title="Inspect details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Action to advance stage (for Admin/Manager) */}
                          {canManage && nextStage && (
                            <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-end">
                              <button
                                onClick={() => onAdvanceStage(item.id, nextStage)}
                                className="text-[11px] font-semibold text-neutral-900 hover:text-black flex items-center gap-1 hover:underline"
                              >
                                <span>Advance to Step {idx + 2}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
