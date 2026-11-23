import React from 'react';
import { Client, Employee, Deliverable, Task, Project, User } from '@/lib/types';
import { TODAY_STRING } from '@/lib/utils';
import { FolderGit2, CheckCircle2, Clock, Users } from 'lucide-react';
import { PlanexGreetingBar } from './PlanexGreetingBar';
import { PlanexKpiRow, KpiItem } from './PlanexKpiRow';
import { PlanexProjectsTable } from './PlanexProjectsTable';
import { PlanexTaskBoard } from './PlanexTaskBoard';
import { PlanexCalendar, CalendarEventItem } from './PlanexCalendar';
import { PlanexProjectSummary } from './PlanexProjectSummary';

interface ManagerDashboardProps {
  clients: Client[];
  employees: Employee[];
  deliverables: Deliverable[];
  tasks: Task[];
  projects?: Project[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  onSelectTask: (task: Task) => void;
  onSelectProject?: (project: Project) => void;
  onCreateTask: () => void;
  onCreateClient: () => void;
  onCreateDeliverable: () => void;
  onCreateProject?: () => void;
}

export function ManagerDashboard({
  clients,
  employees,
  deliverables,
  tasks,
  projects = [],
  currentUser,
  onNavigateTab,
  onSelectDeliverable,
  onSelectTask,
  onSelectProject,
  onCreateTask,
  onCreateClient,
  onCreateDeliverable,
  onCreateProject,
}: ManagerDashboardProps) {
  const today = TODAY_STRING;

  const activeProjects = projects.filter((p) => p.status !== 'archived');
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const overdueTasks = tasks.filter((t) => t.deadline && t.deadline < today && t.status !== 'completed');
  const activeEmployees = employees.filter((e) => e.status === 'active');

  // KPI Items matching reference: Total Projects, Active Tasks, Overdue Tasks, Team Members
  const kpiItems: KpiItem[] = [
    {
      id: 'projects',
      label: 'Total Projects',
      value: activeProjects.length,
      icon: FolderGit2,
      onClick: () => onNavigateTab('projects_tasks'),
    },
    {
      id: 'active_tasks',
      label: 'Active Tasks',
      value: activeTasks.length.toLocaleString(),
      icon: CheckCircle2,
      onClick: () => onNavigateTab('projects_tasks'),
    },
    {
      id: 'overdue_tasks',
      label: 'Overdue Tasks',
      value: overdueTasks.length,
      icon: Clock,
      onClick: () => onNavigateTab('projects_tasks'),
    },
    {
      id: 'team_members',
      label: 'Team Members',
      value: activeEmployees.length,
      icon: Users,
      onClick: () => onNavigateTab('employees'),
    },
  ];

  // Calendar Events from tasks and project deadlines
  const calendarEvents: CalendarEventItem[] = [
    ...tasks
      .filter((t) => t.deadline)
      .map((t) => ({
        id: t.id,
        title: t.title,
        date: t.deadline.split('T')[0],
        type: 'task' as const,
        priority: t.priority,
      })),
    ...projects
      .filter((p) => p.targetEndDate)
      .map((p) => ({
        id: p.id,
        title: p.title,
        date: p.targetEndDate.split('T')[0],
        type: 'deadline' as const,
        priority: p.priority,
      })),
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Greeting Bar (Identical Manager / Admin permissions) */}
      <PlanexGreetingBar
        userName={currentUser.name.split(' ')[0] || currentUser.name}
        subtitle="Here's a quick overview of your workspace today."
        primaryActionLabel="Create Project"
        onPrimaryAction={onCreateProject || onCreateTask}
      />

      {/* 2. KPI Cards Row */}
      <PlanexKpiRow items={kpiItems} />

      {/* 3. Main 2-Column Split matching Planex Reference */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column (~64% width on desktop) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Projects Overview Table */}
          <PlanexProjectsTable
            projects={activeProjects}
            deliverables={deliverables}
            onCreateProject={onCreateProject}
            onSelectProject={onSelectProject}
          />

          {/* Task Board */}
          <PlanexTaskBoard
            tasks={tasks}
            onCreateTask={onCreateTask}
            onSelectTask={onSelectTask}
          />
        </div>

        {/* Right Column (~36% width on desktop) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Calendar Card */}
          <PlanexCalendar
            events={calendarEvents}
            onAddEvent={onCreateTask}
            onSelectDate={(d) => {
              // Could filter or highlight tasks on that date
            }}
          />

          {/* Projects Summary Card */}
          <PlanexProjectSummary
            projects={activeProjects}
            deliverables={deliverables}
            onFilterClick={() => onNavigateTab('projects_tasks')}
            onSelectProject={onSelectProject}
          />
        </div>
      </div>
    </div>
  );
}
