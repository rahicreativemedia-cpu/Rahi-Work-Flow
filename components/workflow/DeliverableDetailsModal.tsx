import React, { useState } from 'react';
import {
  Deliverable,
  CreativeWorkflowStage,
  WORKFLOW_STAGE_METADATA,
  User,
} from '@/lib/types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { hasFullAdminAccess } from '@/lib/permissions';
import { formatDateTime } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Video,
  ArrowRight,
  Ban,
  Calendar,
  Layers,
  Send,
  MessageSquare,
} from 'lucide-react';

interface DeliverableDetailsModalProps {
  deliverable: Deliverable | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateStage: (deliverableId: string, stage: CreativeWorkflowStage, extra?: any) => void;
  onClientDecision?: (
    deliverableId: string,
    type: 'script' | 'video',
    decision: 'approve' | 'revision',
    feedback: string
  ) => void;
  onCancelDeliverable?: (deliverableId: string, reason: string) => void;
}

export function DeliverableDetailsModal({
  deliverable,
  isOpen,
  onClose,
  currentUser,
  onUpdateStage,
  onClientDecision,
  onCancelDeliverable,
}: DeliverableDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'workflow' | 'script' | 'media' | 'versions'>('workflow');
  const [feedbackText, setFeedbackText] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  if (!deliverable) return null;

  const canAdmin = hasFullAdminAccess(currentUser);
  const isClientOwner = currentUser.role === 'client' && currentUser.clientId === deliverable.clientId;
  const canDecideApproval = isClientOwner || canAdmin;

  const allStages: CreativeWorkflowStage[] = [
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

  const currentStageIndex = allStages.indexOf(deliverable.stage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={deliverable.title}
      description={`${deliverable.clientName} • ${deliverable.projectTitle} • Target: ${deliverable.targetMonth}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Deliverable Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Type:</span>
            <span className="capitalize font-bold text-slate-900">{deliverable.type}</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">Creative:</span>
            <span className="font-bold text-slate-900">{deliverable.assignedEmployeeName}</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">Deadline:</span>
            <span className="font-bold text-slate-900">{deliverable.deadline}</span>
          </div>

          <div className="flex items-center gap-2">
            {deliverable.isCountedTowardsCommitment ? (
              <Badge variant="emerald" size="md">
                ✓ Counted in Client Commitment
              </Badge>
            ) : deliverable.status === 'cancelled' ? (
              <Badge variant="slate" size="md">
                Cancelled (Preserved in History)
              </Badge>
            ) : (
              <Badge variant="blue" size="md">
                In Production Pipeline
              </Badge>
            )}
          </div>
        </div>

        {/* Cancelled Notice Banner */}
        {deliverable.status === 'cancelled' && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
            <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Deliverable Cancelled (Preserved in Audit Log):</strong>{' '}
              {deliverable.cancellationReason || 'No reason provided.'}
              {deliverable.cancelledAt && (
                <div className="text-[11px] text-rose-700 mt-0.5">
                  Cancelled on: {formatDateTime(deliverable.cancelledAt)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            10-Stage Workflow Pipeline
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Script & Copywriting {deliverable.scriptApproved && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'media'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            Video & Visual Assets {deliverable.videoApproved && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'versions'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Version History (v{deliverable.currentVersion})
          </button>
        </div>

        {/* TAB 1: WORKFLOW TIMELINE */}
        {activeTab === 'workflow' && (
          <div className="space-y-5">
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Current Active Stage: {WORKFLOW_STAGE_METADATA[deliverable.stage].label} (Step {currentStageIndex + 1} of 10)
              </span>
              <span className="text-slate-500">
                Status: <strong className="capitalize">{deliverable.status.replace('_', ' ')}</strong>
              </span>
            </div>

            {/* 10-Stage Horizontal Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {allStages.map((stageKey, idx) => {
                const meta = WORKFLOW_STAGE_METADATA[stageKey];
                const isCurrent = stageKey === deliverable.stage;
                const isPast = idx < currentStageIndex;
                const isFuture = idx > currentStageIndex;

                return (
                  <div
                    key={stageKey}
                    onClick={() => canAdmin && onUpdateStage(deliverable.id, stageKey)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : isPast
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    } ${canAdmin ? 'cursor-pointer hover:border-blue-400' : ''}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span>Step {meta.step}</span>
                      {isPast ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      ) : null}
                    </div>
                    <div className="text-xs font-semibold mt-1 leading-tight truncate">
                      {meta.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Administrative Controls to Advance Stage */}
            {canAdmin && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Equal Admin Actions (Admin & Manager)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Advance stage or finalize delivery
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentStageIndex < allStages.length - 1 && (
                    <button
                      onClick={() =>
                        onUpdateStage(deliverable.id, allStages[currentStageIndex + 1])
                      }
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Advance to Next Step ({WORKFLOW_STAGE_METADATA[allStages[currentStageIndex + 1]].label})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {deliverable.stage !== 'publishing_or_delivery' && (
                    <button
                      onClick={() =>
                        onUpdateStage(deliverable.id, 'publishing_or_delivery', {
                          status: 'published',
                        })
                      }
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Published & Delivered (Commitment Count +1)</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowCancelPrompt(!showCancelPrompt)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel Deliverable...
                  </button>
                </div>

                {showCancelPrompt && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-300 space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Reason for cancellation (will be preserved in audit history):
                    </label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. Scope revised by client / product out of stock"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowCancelPrompt(false)}
                        className="px-2.5 py-1 text-xs text-slate-600"
                      >
                        Nevermind
                      </button>
                      <button
                        onClick={() => {
                          if (onCancelDeliverable) {
                            onCancelDeliverable(deliverable.id, cancelReason);
                            onClose();
                          }
                        }}
                        className="px-3 py-1 text-xs font-semibold bg-rose-600 text-white rounded"
                      >
                        Confirm Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Client Approval Action Box (If pending in client review stage) */}
            {(deliverable.stage === 'client_script_approval' ||
              deliverable.stage === 'client_video_approval') &&
              canDecideApproval && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">
                      Client Review Action Required:{' '}
                      {deliverable.stage === 'client_script_approval' ? 'Script Approval' : 'Video Approval'}
                    </span>
                    <Badge variant="purple">Awaiting Client Response</Badge>
                  </div>

                  <p className="text-xs text-purple-800">
                    Review the content in the Script or Video tabs above, then submit your sign-off or revision request.
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Provide specific feedback or revision instructions (mandatory for revision requests)..."
                      className="w-full text-xs p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 text-slate-900"
                      rows={3}
                    />

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          if (!feedbackText.trim()) {
                            alert('Please provide feedback notes describing the revision required.');
                            return;
                          }
                          const type =
                            deliverable.stage === 'client_script_approval' ? 'script' : 'video';
                          onClientDecision?.(deliverable.id, type, 'revision', feedbackText);
                          onClose();
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        Request Revisions
                      </button>

                      <button
                        onClick={() => {
                          const type =
                            deliverable.stage === 'client_script_approval' ? 'script' : 'video';
                          onClientDecision?.(
                            deliverable.id,
                            type,
                            'approve',
                            feedbackText || 'Approved without changes'
                          );
                          onClose();
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Content</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* TAB 2: SCRIPT */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-semibold text-slate-700">Script Approval Status:</span>
              {deliverable.scriptApproved ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Client Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> Pending Final Script Sign-Off
                </span>
              )}
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Voiceover Script & Direct Response Copy
              </h4>
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 p-4 rounded-lg border border-slate-200">
                {deliverable.scriptText || 'No script text entered yet.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA ASSETS */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-semibold text-slate-700">Video Approval Status:</span>
              {deliverable.videoApproved ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Client Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> In Video Production / Review
                </span>
              )}
            </div>

            {deliverable.mediaUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-[380px] flex items-center justify-center">
                <video
                  src={deliverable.mediaUrl}
                  controls
                  className="w-full h-full max-h-[380px] object-contain"
                />
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No video preview uploaded yet for this deliverable.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VERSION HISTORY */}
        {activeTab === 'versions' && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Deliverable Iteration & Version Log
            </div>

            {deliverable.versions && deliverable.versions.length > 0 ? (
              deliverable.versions.map((ver, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">Version {ver.version}</div>
                    <p className="text-slate-600 mt-0.5">{ver.notes || ver.scriptText || 'Asset update'}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{ver.submittedAt}</span>
                  </div>
                  {ver.mediaUrl && (
                    <a
                      href={ver.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View Asset
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 p-4 text-center">
                No prior version records.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
