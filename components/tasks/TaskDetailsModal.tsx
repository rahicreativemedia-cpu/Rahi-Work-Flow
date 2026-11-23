import React, { useState } from 'react';
import { Task, User, TaskStatus, Employee, Priority } from '@/lib/types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  getPriorityBadge,
  getTaskStatusBadge,
  formatDateTime,
  getWorkloadCapacityInfo,
} from '@/lib/utils';
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
  UserCheck,
  AlertTriangle,
  Calendar,
  XCircle,
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
  onReassignTask?: (
    taskId: string,
    newEmployeeId: string,
    priority?: Priority,
    deadline?: string
  ) => Promise<void> | void;
  onCancelTask?: (taskId: string) => Promise<void> | void;
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
  onReassignTask,
  onCancelTask,
}: TaskDetailsModalProps) {
  const [commentText, setCommentText] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    task?.assignedEmployeeId || employees[0]?.id || ''
  );
  const [selectedPriority, setSelectedPriority] = useState<Priority>(
    task?.priority || 'medium'
  );
  const [selectedDeadline, setSelectedDeadline] = useState(task?.deadline || '');

  if (!task) return null;

  const canAdmin = hasFullAdminAccess(currentUser);
  const isAssigned =
    currentUser.employeeId === task.assignedEmployeeId ||
    currentUser.id === task.assignedEmployeeId ||
    currentUser.name.toLowerCase() === task.assignedEmployeeName.toLowerCase();

  const priorityBadge = getPriorityBadge(task.priority);
  const statusBadge = getTaskStatusBadge(task.status);

  // Selected target employee capacity check
  const targetEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const targetCapInfo = targetEmployee
    ? getWorkloadCapacityInfo(
        targetEmployee.currentActiveTasks,
        targetEmployee.maxConcurrentTasks
      )
    : null;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText);
    setCommentText('');
  };

  const handleSaveReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onReassignTask) return;
    await onReassignTask(
      task.id,
      selectedEmployeeId,
      selectedPriority,
      selectedDeadline
    );
    setIsReassigning(false);
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
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full font-bold border ${priorityBadge.bg}`}>
              {priorityBadge.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full font-bold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-neutral-500">
            <span>
              Assignee: <strong className="text-neutral-800">{task.assignedEmployeeName}</strong> ({task.assignedEmployeeDepartment})
            </span>
            <span>
              Deadline: <strong className="text-neutral-800">{task.deadline}</strong>
            </span>
          </div>
        </div>

        {/* Admin/Manager Delegation & Reassignment Module */}
        {canAdmin && onReassignTask && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-black" />
                <h4 className="text-xs font-bold text-black uppercase tracking-wider">
                  Task Delegation & Reassignment (Admin & Manager Parity)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEmployeeId(task.assignedEmployeeId);
                  setSelectedPriority(task.priority);
                  setSelectedDeadline(task.deadline);
                  setIsReassigning(!isReassigning);
                }}
                className="text-xs font-semibold text-neutral-900 hover:text-black underline"
              >
                {isReassigning ? 'Cancel Reassignment' : 'Reassign Task / Change Priority'}
              </button>
            </div>

            {isReassigning ? (
              <form onSubmit={handleSaveReassignment} className="mt-3 space-y-3 bg-white p-3.5 rounded-lg border border-neutral-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Assign Creative Specialist *
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium"
                    >
                      {employees.map((emp) => {
                        const cap = getWorkloadCapacityInfo(emp.currentActiveTasks, emp.maxConcurrentTasks);
                        return (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.department}) — {emp.currentActiveTasks}/{emp.maxConcurrentTasks} ({cap.label})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Update Priority
                    </label>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value as Priority)}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={selectedDeadline}
                      onChange={(e) => setSelectedDeadline(e.target.value)}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
                    />
                  </div>

                  {targetCapInfo?.isOverloaded && (
                    <div className="flex items-center gap-2 p-2 bg-neutral-100 border border-neutral-300 rounded-lg text-xs text-black">
                      <AlertTriangle className="w-4 h-4 text-black shrink-0" />
                      <span>
                        <strong>Capacity Warning:</strong> {targetEmployee?.name} is at maximum concurrent task capacity ({targetEmployee?.currentActiveTasks}/{targetEmployee?.maxConcurrentTasks}).
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReassigning(false)}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-neutral-700">
                Currently assigned to <strong>{task.assignedEmployeeName}</strong>. Admin and Manager can reassign tasks to any team member across all departments.
              </p>
            )}
          </div>
        )}

        {/* Description & Required Output */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Instructions & Description
            </h4>
            <p className="text-xs text-neutral-800 bg-white p-3.5 rounded-lg border border-neutral-200 leading-relaxed">
              {task.description || 'No detailed instructions provided.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Required Creative Output
            </h4>
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black font-medium">
              {task.requiredOutput}
            </div>
          </div>
        </div>

        {/* Reference Files */}
        {task.referenceFiles.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Reference Files & Assets
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {task.referenceFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-medium text-neutral-800 truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submissions Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Creative Submissions ({task.submissions.length})
            </h4>

            {(isAssigned || canAdmin) && task.status !== 'completed' && (
              <button
                onClick={() => onSubmitWork(task)}
                className="text-xs font-semibold text-neutral-900 hover:text-black underline flex items-center gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Version</span>
              </button>
            )}
          </div>

          {task.submissions.length === 0 ? (
            <div className="p-4 text-center border border-dashed border-neutral-200 rounded-lg text-xs text-neutral-400">
              No submissions uploaded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {task.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">Version {sub.version}</span>
                      <span className="text-[11px] text-neutral-500 font-medium">({sub.fileName})</span>
                      <span className="text-[10px] text-neutral-400">• {sub.fileSize}</span>
                    </div>
                    {sub.notes && <p className="text-neutral-600 mt-1">{sub.notes}</p>}
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Submitted by {sub.submittedByUserName} on {formatDateTime(sub.submittedAt)}
                    </span>
                  </div>

                  {sub.fileUrl && (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-900 font-semibold rounded-lg hover:bg-neutral-100 text-xs shrink-0"
                    >
                      Preview File
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin/Manager Actions: Change Status & Cancel */}
        {canAdmin && (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700">Quick Status Update (Admin/Manager):</span>
              {onCancelTask && task.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this task? It will be archived safely.')) {
                      onCancelTask(task.id);
                    }
                  }}
                  className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Task</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['todo', 'in_progress', 'in_review', 'revision', 'completed'] as TaskStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(task.id, st)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-all ${
                      task.status === st
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
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
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion & Feedback ({task.comments.length})</span>
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {task.comments.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No comments yet. Start the conversation.</p>
            ) : (
              task.comments.map((cmt) => (
                <div key={cmt.id} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-800">{cmt.userName}</span>
                    <span className="text-[10px] text-neutral-400">{formatDateTime(cmt.createdAt)}</span>
                  </div>
                  <p className="text-neutral-700">{cmt.text}</p>
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
              className="flex-1 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
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
