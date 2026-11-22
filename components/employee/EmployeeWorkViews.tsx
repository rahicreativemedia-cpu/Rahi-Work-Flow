import React from 'react';
import { Task, Deliverable, User, WORKFLOW_STAGE_METADATA } from '@/lib/types';
import { getPriorityBadge, getTaskStatusBadge, formatDateTime } from '@/lib/utils';
import { Badge } from '../common/Badge';
import { UploadCloud, MessageSquareWarning, Layers, History, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface EmployeeWorkViewsProps {
  tasks: Task[];
  deliverables: Deliverable[];
  currentUser: User;
  mode: 'submit_work' | 'feedback_revisions' | 'my_deliverables' | 'activity';
  onSelectTask: (task: Task) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  onSubmitWork: (task: Task) => void;
}

export function EmployeeWorkViews({
  tasks,
  deliverables,
  currentUser,
  mode,
  onSelectTask,
  onSelectDeliverable,
  onSubmitWork,
}: EmployeeWorkViewsProps) {
  const myTasks = tasks.filter(
    (t) =>
      t.assignedEmployeeId === currentUser.employeeId ||
      t.assignedEmployeeId === currentUser.id ||
      t.assignedEmployeeName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const myDeliverables = deliverables.filter(
    (d) =>
      d.assignedEmployeeId === currentUser.employeeId ||
      d.assignedEmployeeName.toLowerCase() === currentUser.name.toLowerCase()
  );

  // MODE 1: SUBMIT WORK
  if (mode === 'submit_work') {
    const pendingSubmissionTasks = myTasks.filter((t) => t.status !== 'completed');
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Submit Completed Creative Work
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload new cuts, scripts, or revised assets. Submitting work automatically routes it to internal manager review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingSubmissionTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {task.clientName}
                  </span>
                  <span className="text-[11px] text-slate-400">Due {task.deadline}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                <div className="mt-2 text-[11px] text-slate-500 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                  Required: {task.requiredOutput}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {task.submissions.length} version(s) submitted
                </span>
                <button
                  onClick={() => onSubmitWork(task)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Version {task.submissions.length + 1}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MODE 2: FEEDBACK & REVISIONS
  if (mode === 'feedback_revisions') {
    const revisionTasks = myTasks.filter(
      (t) => t.status === 'revision' || t.feedbackNotes || t.comments.length > 0
    );

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Client & Manager Feedback & Revision Requests
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Action items and revision notes requiring your creative adjustments.
          </p>
        </div>

        <div className="space-y-4">
          {revisionTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
              No active revision requests. You are all caught up!
            </div>
          ) : (
            revisionTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{task.title}</span>
                    <Badge variant={task.status === 'revision' ? 'rose' : 'blue'}>
                      {task.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400">Due {task.deadline}</span>
                </div>

                {task.feedbackNotes && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                    <strong>Revision Note:</strong> {task.feedbackNotes}
                  </div>
                )}

                {task.comments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Recent Feedback Comments:
                    </span>
                    {task.comments.slice(-2).map((cmt) => (
                      <div key={cmt.id} className="text-xs text-slate-700 bg-slate-50 p-2 rounded">
                        <strong className="text-slate-900">{cmt.userName}:</strong> {cmt.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // MODE 3: MY DELIVERABLES
  if (mode === 'my_deliverables') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              My Assigned Creative Deliverables
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking your deliverables across the 10-stage creative production pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myDeliverables.map((del) => {
            const stageMeta = WORKFLOW_STAGE_METADATA[del.stage];
            return (
              <div
                key={del.id}
                onClick={() => onSelectDeliverable(del)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {del.clientName}
                    </span>
                    <span className="text-[10px] text-slate-400">v{del.currentVersion}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{del.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{del.type} • Target: {del.targetMonth}</p>

                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {stageMeta?.step}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{stageMeta?.label}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Due {del.deadline}</span>
                  <span className="font-semibold text-blue-600">Inspect Stage →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // MODE 4: ACTIVITY HISTORY
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            My Creative Activity Log
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          History of tasks completed, versions uploaded, and feedback received.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 p-2">
        {myTasks.map((task) => (
          <div key={task.id} className="p-4 flex items-start justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900">{task.title}</div>
              <p className="text-slate-500 mt-0.5">
                Client: {task.clientName} • Current Status: <strong className="capitalize">{task.status}</strong>
              </p>
              {task.submissions.length > 0 && (
                <div className="mt-1 text-[11px] text-blue-600 font-medium">
                  {task.submissions.length} submission(s) logged on file
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400">{formatDateTime(task.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
