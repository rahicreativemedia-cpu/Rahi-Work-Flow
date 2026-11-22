import React, { useState } from 'react';
import { Task, User, TaskStatus, Employee } from '@/lib/types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { getPriorityBadge, getTaskStatusBadge, formatDateTime } from '@/lib/utils';
import { hasFullAdminAccess } from '@/lib/permissions';
import {
  Clock,
  User as UserIcon,
  Briefcase,
  Paperclip,
  UploadCloud,
  CheckCircle2,
  MessageSquare,
  Send,
  FileCheck,
} from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  employees: Employee[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onAddComment: (taskId: string, text: string) => void;
  onSubmitWork: (task: Task) => void;
}

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  currentUser,
  employees,
  onUpdateStatus,
  onAddComment,
  onSubmitWork,
}: TaskDetailsModalProps) {
  const [commentText, setCommentText] = useState('');

  if (!task) return null;

  const canAdmin = hasFullAdminAccess(currentUser);
  const isAssigned =
    currentUser.employeeId === task.assignedEmployeeId ||
    currentUser.id === task.assignedEmployeeId ||
    currentUser.name.toLowerCase() === task.assignedEmployeeName.toLowerCase();

  const priorityBadge = getPriorityBadge(task.priority);
  const statusBadge = getTaskStatusBadge(task.status);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText);
    setCommentText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description={`${task.clientName} • ${task.projectTitle}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full font-bold border ${priorityBadge.bg}`}>
              {priorityBadge.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full font-bold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>
              Assignee: <strong className="text-slate-800">{task.assignedEmployeeName}</strong>
            </span>
            <span>
              Deadline: <strong className="text-slate-800">{task.deadline}</strong>
            </span>
          </div>
        </div>

        {/* Description & Required Output */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Instructions & Description
            </h4>
            <p className="text-xs text-slate-800 bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed">
              {task.description || 'No detailed instructions provided.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Required Creative Output
            </h4>
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium">
              {task.requiredOutput}
            </div>
          </div>
        </div>

        {/* Reference Files */}
        {task.referenceFiles.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Reference Files & Assets
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {task.referenceFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submissions Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Creative Submissions ({task.submissions.length})
            </h4>

            {(isAssigned || canAdmin) && task.status !== 'completed' && (
              <button
                onClick={() => onSubmitWork(task)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Version</span>
              </button>
            )}
          </div>

          {task.submissions.length === 0 ? (
            <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
              No submissions uploaded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {task.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Version {sub.version}</span>
                      <span className="text-[11px] text-slate-500 font-medium">({sub.fileName})</span>
                      <span className="text-[10px] text-slate-400">• {sub.fileSize}</span>
                    </div>
                    {sub.notes && <p className="text-slate-600 mt-1">{sub.notes}</p>}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Submitted by {sub.submittedByUserName} on {formatDateTime(sub.submittedAt)}
                    </span>
                  </div>

                  {sub.fileUrl && (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white border border-slate-200 text-blue-600 font-semibold rounded hover:bg-slate-100 text-xs shrink-0"
                    >
                      Preview File
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin/Manager Actions: Change Status */}
        {canAdmin && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700">Quick Status Update (Admin/Manager):</span>
            <div className="flex flex-wrap gap-2">
              {(['todo', 'in_progress', 'in_review', 'revision', 'completed'] as TaskStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(task.id, st)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-all ${
                      task.status === st
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Comments Stream */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion & Feedback ({task.comments.length})</span>
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {task.comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation.</p>
            ) : (
              task.comments.map((cmt) => (
                <div key={cmt.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{cmt.userName}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(cmt.createdAt)}</span>
                  </div>
                  <p className="text-slate-700">{cmt.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="mt-3 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add feedback or task update..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
