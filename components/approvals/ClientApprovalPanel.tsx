import React, { useState } from 'react';
import {
  ClientApprovalRecord,
  Deliverable,
  User,
} from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '../common/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Video,
  FileText,
  UserCheck,
  Send,
  MessageSquare,
  History,
  ShieldCheck,
  Tag,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface ClientApprovalPanelProps {
  deliverables: Deliverable[];
  approvals: ClientApprovalRecord[];
  currentUser: User;
  onDecision: (
    deliverableId: string,
    type: 'script' | 'video',
    decision: 'approve' | 'revision',
    feedback: string,
    categories?: string[]
  ) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
}

const SCRIPT_CATEGORIES = [
  'Hook / Angle',
  'Brand Tone / Voice',
  'Call-to-Action (CTA)',
  'Product Details / Accuracy',
  'Pacing / Timing',
  'Grammar / Copy',
];

const VIDEO_CATEGORIES = [
  'Visual Cuts / Pacing',
  'Voiceover / Audio Mix',
  'Captions & Subtitles',
  'Color Grading / Style',
  'Thumbnail / Cover',
  'Aspect Ratio / Formatting',
];

export function ClientApprovalPanel({
  deliverables,
  approvals,
  currentUser,
  onDecision,
  onSelectDeliverable,
}: ClientApprovalPanelProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingFilter, setPendingFilter] = useState<'all' | 'script' | 'video'>('all');
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [selectedCategoriesMap, setSelectedCategoriesMap] = useState<Record<string, string[]>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // History filters
  const [historyDecisionFilter, setHistoryDecisionFilter] = useState<'all' | 'approved' | 'revision_requested'>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'script' | 'video'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const isClient = currentUser.role === 'client';
  const isAdminOrManager = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Filter deliverables requiring review
  const allPendingDeliverables = deliverables.filter((d) => {
    if (isClient && d.clientId !== currentUser.clientId) return false;
    return (
      d.stage === 'client_script_approval' ||
      d.stage === 'client_video_approval' ||
      d.status === 'client_review'
    );
  });

  const pendingScripts = allPendingDeliverables.filter((d) => d.stage === 'client_script_approval');
  const pendingVideos = allPendingDeliverables.filter(
    (d) => d.stage === 'client_video_approval' || (d.stage !== 'client_script_approval' && d.status === 'client_review')
  );

  const displayedPending =
    pendingFilter === 'script'
      ? pendingScripts
      : pendingFilter === 'video'
      ? pendingVideos
      : allPendingDeliverables;

  // History filtering
  const visibleApprovals = isClient
    ? approvals.filter((a) => a.clientId === currentUser.clientId)
    : approvals;

  const filteredApprovals = visibleApprovals.filter((appr) => {
    if (historyDecisionFilter !== 'all' && appr.status !== historyDecisionFilter) return false;
    if (historyTypeFilter !== 'all' && appr.type !== historyTypeFilter) return false;
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchClient = appr.clientName.toLowerCase().includes(q);
      const matchTitle = appr.deliverableTitle.toLowerCase().includes(q);
      const matchFeedback = (appr.feedback || '').toLowerCase().includes(q);
      const matchCategories = (appr.categories || []).some((c) => c.toLowerCase().includes(q));
      if (!matchClient && !matchTitle && !matchFeedback && !matchCategories) return false;
    }
    return true;
  });

  const handleFeedbackChange = (delId: string, text: string) => {
    setFeedbackDrafts((prev) => ({ ...prev, [delId]: text }));
    if (validationErrors[delId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[delId];
        return next;
      });
    }
  };

  const toggleCategory = (delId: string, category: string) => {
    setSelectedCategoriesMap((prev) => {
      const current = prev[delId] || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...prev, [delId]: updated };
    });
  };

  const handleApprove = (del: Deliverable, type: 'script' | 'video') => {
    const feedback = feedbackDrafts[del.id] || 'Approved by client without changes.';
    const categories = selectedCategoriesMap[del.id] || [];
    onDecision(del.id, type, 'approve', feedback, categories);
  };

  const handleRevision = (del: Deliverable, type: 'script' | 'video') => {
    const feedback = (feedbackDrafts[del.id] || '').trim();
    if (!feedback) {
      setValidationErrors((prev) => ({
        ...prev,
        [del.id]: 'Revision feedback is mandatory. Please explain what changes are requested.',
      }));
      return;
    }
    const categories = selectedCategoriesMap[del.id] || [];
    onDecision(del.id, type, 'revision', feedback, categories);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Client Review, Feedback & Approval Center
            </h2>
            <span className="text-[11px] font-semibold bg-neutral-100 text-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-300">
              {isClient ? 'Private Client Workspace' : 'Agency Review Pipeline'}
            </span>
            {isAdminOrManager && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-black text-white px-2.5 py-0.5 rounded-full border border-black">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                Administrative Oversight Active
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Review creative drafts, select feedback categories, request revisions with timestamped instructions, or approve deliverables for production and scheduling.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Pending Review ({allPendingDeliverables.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'history'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Decision Log ({visibleApprovals.length})
          </button>
        </div>
      </div>

      {/* Admin / Manager Oversight Indicator */}
      {isAdminOrManager && activeTab === 'pending' && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-black mt-0.5 shrink-0" />
          <div className="text-xs text-neutral-900">
            <span className="font-bold">Full Administrative Access:</span> You can record approvals or request revisions on behalf of clients. All actions are attributed in the audit log with your name and role.
          </div>
        </div>
      )}

      {/* TAB 1: PENDING ITEMS FOR REVIEW */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Sub-filters for Pending Review */}
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-neutral-200 text-xs font-medium">
            <span className="text-neutral-500 text-[11px] px-2 font-semibold">Filter Pending:</span>
            <button
              onClick={() => setPendingFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                pendingFilter === 'all'
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Pending ({allPendingDeliverables.length})
            </button>
            <button
              onClick={() => setPendingFilter('script')}
              className={`px-3 py-1 rounded-md transition-colors ${
                pendingFilter === 'script'
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Script Approvals (Stage 4: {pendingScripts.length})
            </button>
            <button
              onClick={() => setPendingFilter('video')}
              className={`px-3 py-1 rounded-md transition-colors ${
                pendingFilter === 'video'
                  ? 'bg-black text-white font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Video Approvals (Stage 7: {pendingVideos.length})
            </button>
          </div>

          {displayedPending.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-neutral-200 text-neutral-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-black mx-auto mb-2" />
              <p className="font-semibold text-neutral-700">All clear!</p>
              <p className="text-neutral-500 mt-1">
                {pendingFilter === 'script'
                  ? 'No script approvals pending at this time.'
                  : pendingFilter === 'video'
                  ? 'No video rough cuts pending client sign-off.'
                  : 'No deliverables currently awaiting review.'}
              </p>
            </div>
          ) : (
            displayedPending.map((del) => {
              const reviewType =
                del.stage === 'client_script_approval' ? 'script' : 'video';
              const feedback = feedbackDrafts[del.id] || '';
              const selectedCats = selectedCategoriesMap[del.id] || [];
              const categoryOptions =
                reviewType === 'script' ? SCRIPT_CATEGORIES : VIDEO_CATEGORIES;
              const errorMessage = validationErrors[del.id];

              const wordCount = del.scriptText
                ? del.scriptText.trim().split(/\s+/).filter(Boolean).length
                : 0;
              const estReadingSeconds = Math.ceil(wordCount / 2.5);

              return (
                <div
                  key={del.id}
                  className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden transition-all hover:border-neutral-300"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-neutral-900">{del.title}</span>
                        <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">
                          v{del.currentVersion}
                        </span>
                        <Badge variant={reviewType === 'script' ? 'blue' : 'purple'}>
                          {reviewType === 'script' ? 'Stage 4: Script Approval' : 'Stage 7: Video Approval'}
                        </Badge>
                        <span className="text-[11px] font-semibold text-neutral-500 bg-white border border-neutral-200 px-2 py-0.5 rounded capitalize">
                          {del.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Client: <span className="font-semibold text-neutral-700">{del.clientName}</span> • Project: <span className="font-semibold text-neutral-700">{del.projectTitle}</span> • Assigned:{' '}
                        <span className="font-semibold text-neutral-700">{del.assignedEmployeeName}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectDeliverable(del)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-black underline"
                    >
                      <span>Full 10-Stage Pipeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Body: Dual Pane (Preview & Decision Form) */}
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Pane: Content Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                          {reviewType === 'script' ? (
                            <>
                              <FileText className="w-4 h-4 text-black" />
                              <span>Script Draft Preview (v{del.currentVersion})</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4 text-black" />
                              <span>Video Asset Preview (v{del.currentVersion})</span>
                            </>
                          )}
                        </h4>
                        {reviewType === 'script' && wordCount > 0 && (
                          <span className="text-[11px] text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded">
                            {wordCount} words (~{estReadingSeconds}s read)
                          </span>
                        )}
                        {reviewType === 'video' && (
                          <span className="text-[11px] text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded">
                            {del.type === 'reel' ? '9:16 Vertical Video' : '16:9 Long Form'}
                          </span>
                        )}
                      </div>

                      {reviewType === 'script' ? (
                        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-800 font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {del.scriptText || 'Script text ready for client sign-off.'}
                        </div>
                      ) : del.mediaUrl ? (
                        <div className="rounded-lg overflow-hidden border border-neutral-200 bg-black aspect-video max-h-64 flex items-center justify-center">
                          <video
                            src={del.mediaUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-neutral-400 border border-dashed rounded-lg bg-neutral-50/50">
                          <Video className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          Video preview file processing. Media link pending upload.
                        </div>
                      )}

                      {/* Author / Assignee Info */}
                      <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-1">
                        <span>Creative Owner: <strong className="text-neutral-700">{del.assignedEmployeeName}</strong></span>
                        <span>Deadline: <strong className="text-neutral-700">{del.deadline}</strong></span>
                      </div>
                    </div>

                    {/* Right Pane: Review & Decision Form */}
                    <div className="flex flex-col justify-between space-y-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-neutral-800">
                            Client Feedback & Revision Instructions:
                          </label>
                          <span className="text-[10px] text-neutral-500">
                            Mandatory for revisions
                          </span>
                        </div>

                        {/* Standardized Feedback Category Chips */}
                        <div>
                          <div className="text-[11px] font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-black" />
                            <span>Select Feedback Categories (Optional tags):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {categoryOptions.map((cat) => {
                              const isSelected = selectedCats.includes(cat);
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => toggleCategory(del.id, cat)}
                                  className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                                    isSelected
                                      ? 'bg-black text-white shadow-xs'
                                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                                  }`}
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Textarea */}
                        <div>
                          <textarea
                            value={feedback}
                            onChange={(e) => handleFeedbackChange(del.id, e.target.value)}
                            placeholder={
                              reviewType === 'script'
                                ? 'e.g. Please strengthen opening hook at line 1, tone down promotional tone...'
                                : 'e.g. Please trim pause at 0:12, adjust music volume under voiceover...'
                            }
                            className={`w-full text-xs p-3 bg-white border rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-neutral-900 transition-colors ${
                              errorMessage ? 'border-neutral-900' : 'border-neutral-300'
                            }`}
                            rows={4}
                          />
                          {errorMessage && (
                            <p className="text-[11px] text-black mt-1 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {errorMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Decision Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
                        <button
                          onClick={() => handleRevision(del, reviewType)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-200 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-800" />
                          <span>Request Revision (Stage 8)</span>
                        </button>

                        <button
                          onClick={() => handleApprove(del, reviewType)}
                          className="px-5 py-2 bg-gradient-to-r from-rose-900 to-rose-950 hover:brightness-110 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 border border-rose-800"
                        >
                          <CheckCircle2 className="w-4 h-4 text-rose-300" />
                          <span>
                            {reviewType === 'script'
                              ? 'Approve Script (Advance to Stage 5)'
                              : 'Approve Video (Advance to Stage 9)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: AUDIT LOG OF APPROVALS & REVISIONS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Historical Approval & Revision Decision Log</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Preserved audit trail of client decisions, standardized category tags, timestamps, and feedback.
              </p>
            </div>

            {/* History Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -tranneutral-y-1/2" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search deliverables, clients..."
                  className="text-xs pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black"
                />
              </div>

              <select
                value={historyDecisionFilter}
                onChange={(e) => setHistoryDecisionFilter(e.target.value as any)}
                className="text-xs py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-hidden"
              >
                <option value="all">All Decisions</option>
                <option value="approved">Approved Only</option>
                <option value="revision_requested">Revision Requests Only</option>
              </select>

              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="text-xs py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-hidden"
              >
                <option value="all">All Types</option>
                <option value="script">Scripts</option>
                <option value="video">Videos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Deliverable</th>
                  <th className="py-3 px-4">Type & Version</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Feedback & Tags</th>
                  <th className="py-3 px-4">Decided By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      No approval records match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredApprovals.map((appr) => (
                    <tr key={appr.id} className="hover:bg-neutral-50/70">
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-500 text-[11px]">
                        {formatDateTime(appr.decisionDate)}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900">{appr.clientName}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-800">{appr.deliverableTitle}</td>
                      <td className="py-3 px-4 capitalize">
                        {appr.type} <span className="font-semibold text-neutral-500">v{appr.version}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {appr.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded border border-neutral-400">
                            <AlertTriangle className="w-3 h-3" /> Revision Requested
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="space-y-1">
                          {appr.categories && appr.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {appr.categories.map((c) => (
                                <span
                                  key={c}
                                  className="text-[9px] font-semibold bg-neutral-100 text-neutral-800 px-1.5 py-0.2 rounded border border-neutral-300"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-neutral-600 line-clamp-2" title={appr.feedback}>
                            {appr.feedback}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-700 font-medium whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{appr.decidedByUserName}</span>
                          {appr.recordedByAdminOrManager && (
                            <span className="text-[10px] text-neutral-700 font-semibold">
                              (Admin/Manager Oversight)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
