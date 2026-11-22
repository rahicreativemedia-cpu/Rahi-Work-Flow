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
} from 'lucide-react';

interface ClientApprovalPanelProps {
  deliverables: Deliverable[];
  approvals: ClientApprovalRecord[];
  currentUser: User;
  onDecision: (
    deliverableId: string,
    type: 'script' | 'video',
    decision: 'approve' | 'revision',
    feedback: string
  ) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
}

export function ClientApprovalPanel({
  deliverables,
  approvals,
  currentUser,
  onDecision,
  onSelectDeliverable,
}: ClientApprovalPanelProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [activeMediaPreview, setActiveMediaPreview] = useState<string | null>(null);

  const isClient = currentUser.role === 'client';

  // Filter deliverables requiring review
  const pendingReviewDeliverables = deliverables.filter((d) => {
    // If client role, strictly own deliverables
    if (isClient && d.clientId !== currentUser.clientId) return false;
    return (
      d.stage === 'client_script_approval' ||
      d.stage === 'client_video_approval' ||
      d.status === 'client_review'
    );
  });

  const visibleApprovals = isClient
    ? approvals.filter((a) => a.clientId === currentUser.clientId)
    : approvals;

  const handleFeedbackChange = (delId: string, text: string) => {
    setFeedbackDrafts((prev) => ({ ...prev, [delId]: text }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Client Approval & Revision Center
            </h2>
            <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
              {isClient ? 'Private Client Workspace' : 'Agency Review Pipeline'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review scripts and video rough cuts, request revisions with timestamped feedback, or provide final sign-off.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review ({pendingReviewDeliverables.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Decision Log ({visibleApprovals.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PENDING ITEMS FOR REVIEW */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingReviewDeliverables.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All clear! No deliverables currently pending client approval.
            </div>
          ) : (
            pendingReviewDeliverables.map((del) => {
              const reviewType =
                del.stage === 'client_script_approval' ? 'script' : 'video';
              const feedback = feedbackDrafts[del.id] || '';

              return (
                <div
                  key={del.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{del.title}</span>
                        <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          v{del.currentVersion}
                        </span>
                        <Badge variant={reviewType === 'script' ? 'blue' : 'purple'}>
                          {reviewType === 'script' ? 'Script Approval' : 'Video Approval'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client: {del.clientName} • Project: {del.projectTitle} • Assigned:{' '}
                        {del.assignedEmployeeName}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectDeliverable(del)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Open Full Pipeline View →
                    </button>
                  </div>

                  <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Content Preview Box */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        {reviewType === 'script' ? (
                          <>
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>Script Text Draft</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 text-purple-600" />
                            <span>Video Preview Asset</span>
                          </>
                        )}
                      </h4>

                      {reviewType === 'script' ? (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                          {del.scriptText || 'Script text ready for client sign-off.'}
                        </div>
                      ) : del.mediaUrl ? (
                        <div className="rounded-lg overflow-hidden border border-slate-200 bg-black aspect-video max-h-56 flex items-center justify-center">
                          <video
                            src={del.mediaUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                          Video preview file processing...
                        </div>
                      )}
                    </div>

                    {/* Action Form */}
                    <div className="flex flex-col justify-between space-y-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Client Feedback & Revision Notes:
                        </label>
                        <p className="text-[11px] text-slate-500 mb-2">
                          Mandatory when requesting revisions. Feedback will be sent directly to Admin and Manager.
                        </p>
                        <textarea
                          value={feedback}
                          onChange={(e) => handleFeedbackChange(del.id, e.target.value)}
                          placeholder="e.g. Approved script, or please change opening hook at 0:03..."
                          className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400 text-slate-900"
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => {
                            if (!feedback.trim()) {
                              alert('Please provide feedback notes explaining the revision request.');
                              return;
                            }
                            onDecision(del.id, reviewType, 'revision', feedback);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          Request Revision
                        </button>

                        <button
                          onClick={() => {
                            onDecision(
                              del.id,
                              reviewType,
                              'approve',
                              feedback || 'Approved by client without changes'
                            );
                          }}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Proceed</span>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Historical Approval & Revision Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Preserved log of every client decision, version record, timestamp, and feedback.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Deliverable</th>
                  <th className="py-3 px-4">Type & Version</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Feedback / Notes</th>
                  <th className="py-3 px-4">Decided By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleApprovals.map((appr) => (
                  <tr key={appr.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {formatDateTime(appr.decisionDate)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{appr.clientName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{appr.deliverableTitle}</td>
                    <td className="py-3 px-4 capitalize">
                      {appr.type} <span className="font-semibold text-slate-500">v{appr.version}</span>
                    </td>
                    <td className="py-3 px-4">
                      {appr.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Revision Requested
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={appr.feedback}>
                      {appr.feedback}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{appr.decidedByUserName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
