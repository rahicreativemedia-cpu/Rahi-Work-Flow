import React, { useState } from 'react';
import {
  Project,
  Task,
  Client,
  Employee,
  User,
  Priority,
  TaskStatus,
  ProjectStatus,
} from '@/lib/types';
import { formatDateTime, TODAY_STRING, getPriorityBadge, getTaskStatusBadge } from '@/lib/utils';
import { hasFullAdminAccess } from '@/lib/permissions';
import { Badge } from '../common/Badge';
import {
  FolderKanban,
  LayoutGrid,
  List,
  Columns,
  Table as TableIcon,
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  RotateCcw,
  Edit,
  DollarSign,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Paperclip,
  MessageSquare,
  UploadCloud,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProjectsAndTasksCenterProps {
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  employees: Employee[];
  currentUser: User;
  onSelectProject: (project: Project) => void;
  onSelectTask: (task: Task) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: Project) => void;
  onArchiveProject?: (projectId: string) => void;
  onRestoreProject?: (projectId: string) => void;
  onCreateTask?: () => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => void;
  onSubmitWork?: (task: Task) => void;
}

export function ProjectsAndTasksCenter({
  projects,
  tasks,
  clients,
  employees,
  currentUser,
  onSelectProject,
  onSelectTask,
  onCreateProject,
  onEditProject,
  onArchiveProject,
  onRestoreProject,
  onCreateTask,
  onUpdateTaskStatus,
  onSubmitWork,
}: ProjectsAndTasksCenterProps) {
  // Views: 'projects_cards' | 'projects_table' | 'tasks_kanban' | 'tasks_table' | 'calendar'
  const [viewMode, setViewMode] = useState<
    'projects_cards' | 'projects_table' | 'tasks_kanban' | 'tasks_table' | 'calendar'
  >('projects_cards');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const isAdminOrManager = hasFullAdminAccess(currentUser);
  const isEmployee = currentUser.role === 'employee';
  const today = TODAY_STRING;

  // 1. Filter Projects based on role & search
  const filteredProjects = projects.filter((p) => {
    // Role boundary
    if (isEmployee) {
      const empId = currentUser.employeeId || currentUser.id;
      const isAssigned = (p.assignedEmployees || []).includes(empId) || (p.assignedEmployees || []).includes(currentUser.id);
      const hasTask = tasks.some(
        (t) => t.projectId === p.id && (t.assignedEmployeeId === empId || t.assignedEmployeeId === currentUser.id)
      );
      if (!isAssigned && !hasTask) return false;
    }

    if (!showArchived && p.status === 'archived') return false;
    if (showArchived && p.status !== 'archived') return false;

    if (clientFilter !== 'all' && p.clientId !== clientFilter) return false;
    if (projectStatusFilter !== 'all' && p.status !== projectStatusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchClient = p.clientName.toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchDesc) return false;
    }

    return true;
  });

  // 2. Filter Tasks based on role & search
  const filteredTasks = tasks.filter((t) => {
    // Employee boundary: strictly assigned tasks only
    if (isEmployee) {
      const empId = currentUser.employeeId || currentUser.id;
      const match =
        t.assignedEmployeeId === empId ||
        t.assignedEmployeeId === currentUser.id ||
        (t.assignedEmployeeIds && t.assignedEmployeeIds.includes(empId)) ||
        t.assignedEmployeeName.toLowerCase() === currentUser.name.toLowerCase();
      if (!match) return false;
    }

    if (clientFilter !== 'all' && t.clientId !== clientFilter) return false;
    if (employeeFilter !== 'all' && t.assignedEmployeeId !== employeeFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    const isTaskOverdue = t.deadline < today && t.status !== 'completed' && t.status !== 'cancelled';
    if (overdueOnly && !isTaskOverdue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchClient = t.clientName.toLowerCase().includes(q);
      const matchProject = t.projectTitle.toLowerCase().includes(q);
      const matchAssignee = t.assignedEmployeeName.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchProject && !matchAssignee) return false;
    }

    return true;
  });

  // Overdue count calculation
  const overdueTasksCount = tasks.filter(
    (t) => t.deadline < today && t.status !== 'completed' && t.status !== 'cancelled'
  ).length;

  // Kanban Columns Definition
  const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog', color: 'border-neutral-300 bg-neutral-100 text-neutral-700' },
    { id: 'todo', label: 'To Do', color: 'border-neutral-300 bg-neutral-100 text-neutral-800' },
    { id: 'in_progress', label: 'In Progress', color: 'border-neutral-400 bg-neutral-200 text-neutral-900' },
    { id: 'under_review', label: 'Under Review', color: 'border-neutral-400 bg-neutral-200 text-neutral-900' },
    { id: 'revision_required', label: 'Revision Required', color: 'border-neutral-500 bg-neutral-200 text-black' },
    { id: 'approved', label: 'Approved', color: 'border-neutral-400 bg-neutral-100 text-neutral-900' },
    { id: 'completed', label: 'Completed', color: 'border-black bg-black text-white' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Deck */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              Projects & Task Management Center
            </h2>
            <span className="text-[11px] font-semibold bg-neutral-100 text-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-300">
              {isEmployee ? 'My Assigned Work' : 'Agency Project Operations'}
            </span>
            {overdueTasksCount > 0 && !isEmployee && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-black text-white px-2 py-0.5 rounded-full border border-black">
                <AlertCircle className="w-3.5 h-3.5" />
                {overdueTasksCount} Overdue Tasks
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage agency campaigns, track multi-employee project milestones, monitor Kanban task boards, and track deadlines.
          </p>
        </div>

        {/* View Switchers & Creation Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* View Mode Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('projects_cards')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'projects_cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Project Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Projects</span>
            </button>
            <button
              onClick={() => setViewMode('projects_table')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'projects_table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Project List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('tasks_kanban')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'tasks_kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Task Kanban Board"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('tasks_table')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'tasks_table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Task Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Deadlines Calendar View"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Deadlines</span>
            </button>
          </div>

          {/* Action Buttons for Admin and Manager */}
          {isAdminOrManager && (
            <div className="flex items-center gap-2">
              {onCreateProject && (
                <button
                  onClick={onCreateProject}
                  className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              )}
              {onCreateTask && (
                <button
                  onClick={onCreateTask}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Task</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, tasks, clients..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Employee Filter (Admin/Manager only) */}
          {isAdminOrManager && (
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Assignees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.department})
                </option>
              ))}
            </select>
          )}

          {/* Overdue filter toggle */}
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              overdueOnly
                ? 'bg-black border-black text-white'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Overdue Only</span>
          </button>
        </div>

        {/* Project Archive toggle (Admin/Manager) */}
        {isAdminOrManager && (viewMode === 'projects_cards' || viewMode === 'projects_table') && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showArchived
                ? 'bg-neutral-200 border-neutral-400 text-black'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Viewing Archived' : 'Show Archived'}</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: PROJECT CARDS VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'projects_cards' && (
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No projects match the active criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const priorityBadge = getPriorityBadge(project.priority || 'medium');
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;
                const progressPct =
                  project.progress !== undefined
                    ? project.progress
                    : project.totalDeliverablesTarget > 0
                    ? Math.round((project.completedDeliverablesCount / project.totalDeliverablesTarget) * 100)
                    : 0;

                const isDelayed = project.targetEndDate < today && project.status !== 'completed' && project.status !== 'archived';

                return (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                          {project.clientName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                            {priorityBadge.label}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-neutral-600 transition-colors">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.objective && (
                        <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-1">
                          🎯 {project.objective}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Deliverables Completion</span>
                          <span>{project.completedDeliverablesCount} / {project.totalDeliverablesTarget} ({progressPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              progressPct >= 100 ? 'bg-black' : 'bg-neutral-800'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className={isDelayed ? 'text-black font-bold underline' : ''}>
                          Due {project.targetEndDate} {isDelayed && '(DELAYED)'}
                        </span>
                      </div>

                      {/* Budget (Admin / Manager only) */}
                      {isAdminOrManager && project.budget && (
                        <span className="font-semibold text-slate-700">
                          {project.currency} {project.budget.toLocaleString()}
                        </span>
                      )}

                      {/* Edit / Archive Actions for Admin */}
                      {isAdminOrManager && (
                        <div
                          className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onEditProject && (
                            <button
                              onClick={() => onEditProject(project)}
                              className="p-1 text-slate-500 hover:text-black rounded hover:bg-slate-100"
                              title="Edit Project"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {project.status === 'archived' && onRestoreProject ? (
                            <button
                              onClick={() => onRestoreProject(project.id)}
                              className="p-1 text-neutral-700 hover:text-black rounded hover:bg-neutral-100"
                              title="Restore Project"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : onArchiveProject ? (
                            <button
                              onClick={() => onArchiveProject(project.id)}
                              className="p-1 text-slate-400 hover:text-black rounded hover:bg-neutral-100"
                              title="Archive Project"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: PROJECT LIST TABLE VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'projects_table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Deadline</th>
                  {isAdminOrManager && <th className="py-3 px-4">Budget</th>}
                  {isAdminOrManager && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProjects.map((p) => {
                  const priorityBadge = getPriorityBadge(p.priority || 'medium');
                  const progressPct =
                    p.progress !== undefined
                      ? p.progress
                      : p.totalDeliverablesTarget > 0
                      ? Math.round((p.completedDeliverablesCount / p.totalDeliverablesTarget) * 100)
                      : 0;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProject(p)}
                      className="hover:bg-slate-50/70 cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">{p.clientName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.title}</td>
                      <td className="py-3 px-4 capitalize">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                          {priorityBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{progressPct}%</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{p.targetEndDate}</td>
                      {isAdminOrManager && (
                        <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                          {p.budget ? `${p.currency} ${p.budget.toLocaleString()}` : '—'}
                        </td>
                      )}
                      {isAdminOrManager && (
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {onEditProject && (
                              <button
                                onClick={() => onEditProject(p)}
                                className="p-1 text-neutral-500 hover:text-black rounded"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {p.status === 'archived' && onRestoreProject ? (
                              <button
                                onClick={() => onRestoreProject(p.id)}
                                className="p-1 text-neutral-700 hover:text-black rounded hover:bg-neutral-100"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : onArchiveProject ? (
                              <button
                                onClick={() => onArchiveProject(p.id)}
                                className="p-1 text-neutral-400 hover:text-black rounded hover:bg-neutral-100"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 3: TASK BOARD / KANBAN VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'tasks_kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            // Match task status including aliases
            const colTasks = filteredTasks.filter((t) => {
              if (col.id === 'under_review') return t.status === 'under_review' || t.status === 'in_review';
              if (col.id === 'revision_required') return t.status === 'revision_required' || t.status === 'revision';
              return t.status === col.id;
            });

            return (
              <div
                key={col.id}
                className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3 flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[11px] italic">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const priorityBadge = getPriorityBadge(task.priority);
                      const isOverdue = task.deadline < today && task.status !== 'completed';

                      return (
                        <div
                          key={task.id}
                          onClick={() => onSelectTask(task)}
                          className="bg-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                        >
                          {/* Client & Priority */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[9px] font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                              {task.clientName}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${priorityBadge.bg}`}>
                              {priorityBadge.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Footer Info */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                            <span className="truncate max-w-[90px]" title={task.assignedEmployeeName}>
                              {task.assignedEmployeeName}
                            </span>
                            <span className={isOverdue ? 'text-black font-bold underline' : ''}>
                              {task.deadline}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 4: TASK TABLE VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'tasks_table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No tasks found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const priorityBadge = getPriorityBadge(t.priority);
                    const statusBadge = getTaskStatusBadge(t.status);
                    const isOverdue = t.deadline < today && t.status !== 'completed';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className="hover:bg-slate-50/70 cursor-pointer"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">{t.clientName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{t.title}</td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{t.projectTitle}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{t.assignedEmployeeName}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={isOverdue ? 'text-black font-bold underline' : 'text-slate-600'}>
                            {t.deadline} {isOverdue && '(OVERDUE)'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                          {t.submissions.length > 0 && <span className="mr-2">v{t.submissions.length}</span>}
                          {t.comments.length > 0 && <span>💬 {t.comments.length}</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 5: CALENDAR DEADLINE TIMELINE VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Agency Deadlines</h3>
              <p className="text-xs text-slate-500">Chronological schedule of active tasks and project targets.</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Group tasks by deadline */}
            {Array.from(new Set(filteredTasks.map((t) => t.deadline)))
              .sort()
              .map((dateStr) => {
                const dateTasks = filteredTasks.filter((t) => t.deadline === dateStr);
                const isPast = dateStr < today;
                const isDueToday = dateStr === today;

                return (
                  <div key={dateStr} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-black" />
                        <span>{dateStr}</span>
                        {isDueToday && (
                          <span className="text-[10px] font-bold bg-neutral-200 text-black px-1.5 py-0.2 rounded">
                            TODAY
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.2 rounded">
                            PAST DEADLINE
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{dateTasks.length} task(s)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {dateTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs cursor-pointer text-xs"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span className="font-bold text-neutral-900">{t.clientName}</span>
                            <span className="capitalize">{t.status.replace('_', ' ')}</span>
                          </div>
                          <h5 className="font-bold text-slate-800 truncate">{t.title}</h5>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Assignee: {t.assignedEmployeeName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
