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
  UploadCloud,
  Edit3,
  Save,
  Link as LinkIcon,
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
  onUploadVersion?: (
    deliverableId: string,
    versionData: { mediaUrl?: string; scriptText?: string; notes?: string }
  ) => Promise<void> | void;
  onUpdateScript?: (deliverableId: string, scriptText: string) => Promise<void> | void;
  onUpdateMedia?: (deliverableId: string, mediaUrl: string) => Promise<void> | void;
}

export function DeliverableDetailsModal({
  deliverable,
  isOpen,
  onClose,
  currentUser,
  onUpdateStage,
  onClientDecision,
  onCancelDeliverable,
  onUploadVersion,
  onUpdateScript,
  onUpdateMedia,
}: DeliverableDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'workflow' | 'script' | 'media' | 'versions'>('workflow');
  const [feedbackText, setFeedbackText] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // Version upload state
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [newVersionMediaUrl, setNewVersionMediaUrl] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');

  // Script editing state
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editableScriptText, setEditableScriptText] = useState(deliverable?.scriptText || '');

  // Media editing state
  const [isEditingMedia, setIsEditingMedia] = useState(false);
  const [editableMediaUrl, setEditableMediaUrl] = useState(deliverable?.mediaUrl || '');

  if (!deliverable) return null;

  const canAdmin = hasFullAdminAccess(currentUser);
  const isAssigned =
    currentUser.employeeId === deliverable.assignedEmployeeId ||
    currentUser.id === deliverable.assignedEmployeeId;
  const isClientOwner = currentUser.role === 'client' && currentUser.clientId === deliverable.clientId;
  const canDecideApproval = isClientOwner || canAdmin;
  const canEditContent = canAdmin || isAssigned;

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

  const handleUploadNewVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUploadVersion) return;
    await onUploadVersion(deliverable.id, {
      mediaUrl: newVersionMediaUrl || deliverable.mediaUrl,
      notes: newVersionNotes || `Version ${(deliverable.currentVersion || 1) + 1}`,
    });
    setNewVersionMediaUrl('');
    setNewVersionNotes('');
    setShowVersionUpload(false);
  };

  const handleSaveScript = async () => {
    if (!onUpdateScript) return;
    await onUpdateScript(deliverable.id, editableScriptText);
    setIsEditingScript(false);
  };

  const handleSaveMedia = async () => {
    if (!onUpdateMedia) return;
    await onUpdateMedia(deliverable.id, editableMediaUrl);
    setIsEditingMedia(false);
  };

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
                Stage {currentStageIndex + 1} of 10
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
            onClick={() => {
              setEditableScriptText(deliverable.scriptText || '');
              setActiveTab('script');
            }}
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
            onClick={() => {
              setEditableMediaUrl(deliverable.mediaUrl || '');
              setActiveTab('media');
            }}
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
            Version History (v{deliverable.currentVersion || deliverable.versions.length})
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

            {/* 10-Stage Stepper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {allStages.map((stageKey, idx) => {
                const meta = WORKFLOW_STAGE_METADATA[stageKey];
                const isCurrent = stageKey === deliverable.stage;
                const isPast = idx < currentStageIndex;

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
                    Advance stage, request approvals, or finalize delivery
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

            {/* Client Approval Action Box */}
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
                        Request Revisions (Route to Stage 8)
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

        {/* TAB 2: SCRIPT & COPYWRITING */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-semibold text-slate-700">Script Approval Status:</span>
              <div className="flex items-center gap-2">
                {deliverable.scriptApproved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Client Approved on {formatDateTime(deliverable.scriptApprovedAt)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> Pending Final Script Sign-Off
                  </span>
                )}
                {canEditContent && !isEditingScript && (
                  <button
                    onClick={() => setIsEditingScript(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Script</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Voiceover Script & Direct Response Copy
                </h4>
                {isEditingScript && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingScript(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveScript}
                      className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Script Draft</span>
                    </button>
                  </div>
                )}
              </div>

              {isEditingScript ? (
                <textarea
                  rows={8}
                  value={editableScriptText}
                  onChange={(e) => setEditableScriptText(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {deliverable.scriptText || 'No script text entered yet.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA ASSETS */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-semibold text-slate-700">Video Approval Status:</span>
              <div className="flex items-center gap-2">
                {deliverable.videoApproved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Client Approved on {formatDateTime(deliverable.videoApprovedAt)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> In Video Production / Review
                  </span>
                )}
                {canEditContent && !isEditingMedia && (
                  <button
                    onClick={() => setIsEditingMedia(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Update Link</span>
                  </button>
                )}
              </div>
            </div>

            {isEditingMedia && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <input
                  type="text"
                  value={editableMediaUrl}
                  onChange={(e) => setEditableMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 text-xs p-2 bg-white border border-slate-300 rounded"
                />
                <button
                  onClick={() => setIsEditingMedia(false)}
                  className="px-2.5 py-1 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMedia}
                  className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded"
                >
                  Save Media
                </button>
              </div>
            )}

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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Deliverable Iteration & Version Log (Current: v{deliverable.currentVersion || deliverable.versions.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Full historical archive of creative cuts, scripts, and revision iterations.
                </p>
              </div>

              {canEditContent && onUploadVersion && (
                <button
                  onClick={() => setShowVersionUpload(!showVersionUpload)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Version {(deliverable.currentVersion || 1) + 1}</span>
                </button>
              )}
            </div>

            {showVersionUpload && (
              <form onSubmit={handleUploadNewVersionSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-800">
                  Upload New Version {(deliverable.currentVersion || 1) + 1}
                </h5>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Media / Asset URL
                  </label>
                  <input
                    type="text"
                    value={newVersionMediaUrl}
                    onChange={(e) => setNewVersionMediaUrl(e.target.value)}
                    placeholder="https://commondatastorage.googleapis.com/... or MP4 link"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Version Notes & Changelog
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="e.g. Added dynamic captions and corrected color grade"
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVersionUpload(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Save & Upload Version
                  </button>
                </div>
              </form>
            )}

            {deliverable.versions && deliverable.versions.length > 0 ? (
              <div className="space-y-2.5">
                {deliverable.versions.map((ver, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                          Version {ver.version}
                        </span>
                        {ver.submittedByUserName && (
                          <span className="text-slate-500">
                            by <strong>{ver.submittedByUserName}</strong>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          • {formatDateTime(ver.submittedAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{ver.notes || 'Asset iteration'}</p>
                      {ver.scriptText && (
                        <p className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-100 max-h-20 overflow-y-auto">
                          {ver.scriptText}
                        </p>
                      )}
                    </div>

                    {ver.mediaUrl && (
                      <a
                        href={ver.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white border border-slate-200 text-blue-600 font-semibold rounded-lg hover:bg-slate-100 text-xs shrink-0"
                      >
                        Preview Asset
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-6 text-center border border-dashed border-slate-200 rounded-lg">
                No prior version records.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
