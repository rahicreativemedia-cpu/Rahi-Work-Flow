'use client';

import React, { useState, useEffect } from 'react';
import { TODAY_STRING } from '@/lib/utils';
import {
  User,
  Client,
  Employee,
  Project,
  Deliverable,
  Task,
  ClientApprovalRecord,
  NotificationItem,
  Invitation,
  AuditLog,
  CreativeWorkflowStage,
  TaskStatus,
} from '@/lib/types';
import { initialData } from '@/data/seedData';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationsDrawer } from '@/components/layout/NotificationsDrawer';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { CreativePipelineBoard } from '@/components/workflow/CreativePipelineBoard';
import { DeliverableTracker } from '@/components/workflow/DeliverableTracker';
import { DeliverableDetailsModal } from '@/components/workflow/DeliverableDetailsModal';
import { CreateDeliverableModal } from '@/components/workflow/CreateDeliverableModal';
import { ClientApprovalPanel } from '@/components/approvals/ClientApprovalPanel';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { EmployeeSubmitWorkModal } from '@/components/tasks/EmployeeSubmitWorkModal';
import { ClientList } from '@/components/clients/ClientList';
import { CreateClientModal } from '@/components/clients/CreateClientModal';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { CreateEmployeeModal } from '@/components/employees/CreateEmployeeModal';
import { UserManagementView } from '@/components/admin/UserManagementView';
import { AuditLogsView } from '@/components/admin/AuditLogsView';
import { ReportsView } from '@/components/reports/ReportsView';
import { ClientCalendarAndAssets } from '@/components/client/ClientCalendarAndAssets';
import { EmployeeWorkViews } from '@/components/employee/EmployeeWorkViews';
import { hasFullAdminAccess } from '@/lib/permissions';

export default function FlowdeskApp() {
  // Master State initialized with rich seed data
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [currentUser, setCurrentUser] = useState<User>(initialData.users[0]); // Defaults to Rohan Rahi (Boss/Admin)
  const [clients, setClients] = useState<Client[]>(initialData.clients);
  const [employees, setEmployees] = useState<Employee[]>(initialData.employees);
  const [projects, setProjects] = useState<Project[]>(initialData.projects);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(initialData.deliverables);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [approvals, setApprovals] = useState<ClientApprovalRecord[]>(initialData.approvals);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialData.notifications);
  const [invitations, setInvitations] = useState<Invitation[]>(initialData.invitations);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialData.auditLogs);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal dialog states
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskForSubmitWork, setTaskForSubmitWork] = useState<Task | null>(null);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isCreateDeliverableOpen, setIsCreateDeliverableOpen] = useState(false);

  // Fetch live sync from API on initial load
  const refreshData = async () => {
    try {
      const [authRes, clientRes, empRes, projRes, taskRes, delRes, apprRes, notifRes, audRes] =
        await Promise.all([
          fetch(`/api/auth?userId=${currentUser.id}`),
          fetch(`/api/clients?userId=${currentUser.id}`),
          fetch(`/api/employees?userId=${currentUser.id}`),
          fetch(`/api/projects?userId=${currentUser.id}`),
          fetch(`/api/tasks?userId=${currentUser.id}`),
          fetch(`/api/deliverables?userId=${currentUser.id}`),
          fetch(`/api/approvals`),
          fetch(`/api/notifications?userId=${currentUser.id}`),
          fetch(`/api/audit?userId=${currentUser.id}`),
        ]);

      if (authRes.ok) {
        const d = await authRes.json();
        if (d.users) setUsers(d.users);
        if (d.invitations) setInvitations(d.invitations);
      }
      if (clientRes.ok) {
        const d = await clientRes.json();
        if (d.clients) setClients(d.clients);
      }
      if (empRes.ok) {
        const d = await empRes.json();
        if (d.employees) setEmployees(d.employees);
      }
      if (projRes.ok) {
        const d = await projRes.json();
        if (d.projects) setProjects(d.projects);
      }
      if (taskRes.ok) {
        const d = await taskRes.json();
        if (d.tasks) setTasks(d.tasks);
      }
      if (delRes.ok) {
        const d = await delRes.json();
        if (d.deliverables) setDeliverables(d.deliverables);
      }
      if (apprRes.ok) {
        const d = await apprRes.json();
        if (d.approvals) setApprovals(d.approvals);
      }
      if (notifRes.ok) {
        const d = await notifRes.json();
        if (d.notifications) setNotifications(d.notifications);
      }
      if (audRes.ok) {
        const d = await audRes.json();
        if (d.auditLogs) setAuditLogs(d.auditLogs);
      }
    } catch (err) {
      console.warn('API sync fallback to in-memory state:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser.id]);

  // Handle switching persona / portal
  const handleSwitchUser = (newUser: User) => {
    setCurrentUser(newUser);
    // Set appropriate initial tab
    if (newUser.role === 'admin' || newUser.role === 'manager') {
      setActiveTab('overview');
    } else if (newUser.role === 'employee') {
      setActiveTab('my_tasks');
    } else if (newUser.role === 'client') {
      setActiveTab('client_dashboard');
    }
  };

  // Reset database handler
  const handleResetDB = async () => {
    if (!confirm('Reset RAHI Flowdesk database to fresh seed state?')) return;
    try {
      const res = await fetch('/api/reset-db', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setUsers(data.data.users);
          setClients(data.data.clients);
          setEmployees(data.data.employees);
          setProjects(data.data.projects);
          setTasks(data.data.tasks);
          setDeliverables(data.data.deliverables);
          setApprovals(data.data.approvals);
          setNotifications(data.data.notifications);
          setInvitations(data.data.invitations);
          setAuditLogs(data.data.auditLogs);
          setCurrentUser(data.data.users[0]);
          setActiveTab('overview');
          alert('Database reset successfully!');
        }
      }
    } catch {
      alert('Reset completed in local state.');
    }
  };

  // Deliverable Stage Advancement (10 stages)
  const handleAdvanceStage = async (
    deliverableId: string,
    stage: CreativeWorkflowStage,
    extra?: any
  ) => {
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          callerUserId: currentUser.id,
          deliverableId,
          stage,
          ...extra,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Client Approval / Revision Decision
  const handleClientDecision = async (
    deliverableId: string,
    approvalType: 'script' | 'video',
    decision: 'approve' | 'revision',
    feedback: string
  ) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerUserId: currentUser.id,
          deliverableId,
          approvalType,
          decision,
          feedback,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cancel Deliverable
  const handleCancelDeliverable = async (deliverableId: string, reason: string) => {
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          callerUserId: currentUser.id,
          deliverableId,
          reason,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Task Status Update
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          callerUserId: currentUser.id,
          taskId,
          status,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Comment to Task
  const handleAddTaskComment = async (taskId: string, text: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          callerUserId: currentUser.id,
          taskId,
          text,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Work from Employee
  const handleSubmitWork = async (submissionData: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_work',
          callerUserId: currentUser.id,
          ...submissionData,
        }),
      });
      if (res.ok) {
        await refreshData();
        alert('Work submitted successfully! Routed to internal manager review.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Client (Admin & Manager Equal Access)
  const handleSaveClient = async (clientData: any) => {
    try {
      const method = clientData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/clients', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerUserId: currentUser.id,
          ...clientData,
        }),
      });
      if (res.ok) {
        await refreshData();
        setClientToEdit(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Employee (Admin & Manager Equal Access)
  const handleSaveEmployee = async (employeeData: any) => {
    try {
      const method = employeeData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/employees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerUserId: currentUser.id,
          ...employeeData,
        }),
      });
      if (res.ok) {
        await refreshData();
        setEmployeeToEdit(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Task (Admin & Manager Equal Access)
  const handleCreateTask = async (taskData: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          callerUserId: currentUser.id,
          ...taskData,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Deliverable (Admin & Manager Equal Access)
  const handleCreateDeliverable = async (deliverableData: any) => {
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          callerUserId: currentUser.id,
          ...deliverableData,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Invitation Link
  const handleSendInvitation = async (invData: any) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          callerUserId: currentUser.id,
          ...invData,
        }),
      });
      if (res.ok) {
        await refreshData();
        alert('Invitation generated successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Direct User
  const handleCreateDirectUser = async (userData: any) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          callerUserId: currentUser.id,
          ...userData,
        }),
      });
      if (res.ok) {
        await refreshData();
        alert('User account created successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle User Active Status
  const handleToggleUserStatus = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          callerUserId: currentUser.id,
          targetUserId,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark notifications read
  const handleMarkNotifRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: id ? 'mark_read' : undefined,
          notifId: id,
          markAllRead: !id,
          userId: currentUser.id,
        }),
      });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const activePortalRole = currentUser.role;
  const currentClient = clients.find((c) => c.id === currentUser.clientId) || clients[0];

  const pendingApprovalsCount = deliverables.filter(
    (d) =>
      d.status === 'client_review' &&
      (hasFullAdminAccess(currentUser) || d.clientId === currentUser.clientId)
  ).length;

  const overdueTasksCount = tasks.filter(
    (t) =>
      t.deadline < TODAY_STRING &&
      t.status !== 'completed' &&
      (hasFullAdminAccess(currentUser) || t.assignedEmployeeId === currentUser.employeeId)
  ).length;

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        overdueTasksCount={overdueTasksCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <AppHeader
          currentUser={currentUser}
          allUsers={users}
          onSwitchUser={handleSwitchUser}
          unreadNotifsCount={unreadNotifsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onResetDB={handleResetDB}
          activePortal={activePortalRole}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 1. ADMIN PORTAL VIEWS */}
            {activePortalRole === 'admin' && (
              <>
                {activeTab === 'overview' && (
                  <AdminDashboard
                    clients={clients}
                    employees={employees}
                    deliverables={deliverables}
                    tasks={tasks}
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onCreateClient={() => {
                      setClientToEdit(null);
                      setIsCreateClientOpen(true);
                    }}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                  />
                )}
                {activeTab === 'pipeline' && (
                  <CreativePipelineBoard
                    deliverables={deliverables}
                    currentUser={currentUser}
                    onAdvanceStage={handleAdvanceStage}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onCreateDeliverable={() => setIsCreateDeliverableOpen(true)}
                  />
                )}
                {activeTab === 'deliverable_tracker' && (
                  <DeliverableTracker
                    clients={clients}
                    deliverables={deliverables}
                    currentUser={currentUser}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onNewDeliverable={() => setIsCreateDeliverableOpen(true)}
                  />
                )}
                {activeTab === 'clients' && (
                  <ClientList
                    clients={clients}
                    deliverables={deliverables}
                    currentUser={currentUser}
                    onCreateClient={() => {
                      setClientToEdit(null);
                      setIsCreateClientOpen(true);
                    }}
                    onEditClient={(c) => {
                      setClientToEdit(c);
                      setIsCreateClientOpen(true);
                    }}
                    onSelectClientDeliverables={() => setActiveTab('deliverable_tracker')}
                  />
                )}
                {activeTab === 'employees' && (
                  <EmployeeList
                    employees={employees}
                    currentUser={currentUser}
                    onCreateEmployee={() => {
                      setEmployeeToEdit(null);
                      setIsCreateEmployeeOpen(true);
                    }}
                    onEditEmployee={(emp) => {
                      setEmployeeToEdit(emp);
                      setIsCreateEmployeeOpen(true);
                    }}
                  />
                )}
                {activeTab === 'projects_tasks' && (
                  <TaskList
                    tasks={tasks}
                    currentUser={currentUser}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                  />
                )}
                {activeTab === 'approvals' && (
                  <ClientApprovalPanel
                    deliverables={deliverables}
                    approvals={approvals}
                    currentUser={currentUser}
                    onDecision={handleClientDecision}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                  />
                )}
                {activeTab === 'reports' && (
                  <ReportsView
                    clients={clients}
                    employees={employees}
                    deliverables={deliverables}
                    tasks={tasks}
                  />
                )}
                {activeTab === 'users' && (
                  <UserManagementView
                    users={users}
                    invitations={invitations}
                    clients={clients}
                    currentUser={currentUser}
                    onSendInvitation={handleSendInvitation}
                    onCreateDirectUser={handleCreateDirectUser}
                    onToggleUserStatus={handleToggleUserStatus}
                  />
                )}
                {activeTab === 'audit' && <AuditLogsView auditLogs={auditLogs} />}
              </>
            )}

            {/* 2. MANAGER PORTAL VIEWS (100% Equal Permissions to Admin!) */}
            {activePortalRole === 'manager' && (
              <>
                {activeTab === 'overview' && (
                  <ManagerDashboard
                    clients={clients}
                    employees={employees}
                    deliverables={deliverables}
                    tasks={tasks}
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                    onCreateClient={() => {
                      setClientToEdit(null);
                      setIsCreateClientOpen(true);
                    }}
                    onCreateDeliverable={() => setIsCreateDeliverableOpen(true)}
                  />
                )}
                {activeTab === 'pipeline' && (
                  <CreativePipelineBoard
                    deliverables={deliverables}
                    currentUser={currentUser}
                    onAdvanceStage={handleAdvanceStage}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onCreateDeliverable={() => setIsCreateDeliverableOpen(true)}
                  />
                )}
                {activeTab === 'deliverable_tracker' && (
                  <DeliverableTracker
                    clients={clients}
                    deliverables={deliverables}
                    currentUser={currentUser}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onNewDeliverable={() => setIsCreateDeliverableOpen(true)}
                  />
                )}
                {activeTab === 'clients' && (
                  <ClientList
                    clients={clients}
                    deliverables={deliverables}
                    currentUser={currentUser}
                    onCreateClient={() => {
                      setClientToEdit(null);
                      setIsCreateClientOpen(true);
                    }}
                    onEditClient={(c) => {
                      setClientToEdit(c);
                      setIsCreateClientOpen(true);
                    }}
                    onSelectClientDeliverables={() => setActiveTab('deliverable_tracker')}
                  />
                )}
                {activeTab === 'employees' && (
                  <EmployeeList
                    employees={employees}
                    currentUser={currentUser}
                    onCreateEmployee={() => {
                      setEmployeeToEdit(null);
                      setIsCreateEmployeeOpen(true);
                    }}
                    onEditEmployee={(emp) => {
                      setEmployeeToEdit(emp);
                      setIsCreateEmployeeOpen(true);
                    }}
                  />
                )}
                {activeTab === 'projects_tasks' && (
                  <TaskList
                    tasks={tasks}
                    currentUser={currentUser}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                  />
                )}
                {activeTab === 'approvals' && (
                  <ClientApprovalPanel
                    deliverables={deliverables}
                    approvals={approvals}
                    currentUser={currentUser}
                    onDecision={handleClientDecision}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                  />
                )}
                {activeTab === 'reports' && (
                  <ReportsView
                    clients={clients}
                    employees={employees}
                    deliverables={deliverables}
                    tasks={tasks}
                  />
                )}
                {activeTab === 'users' && (
                  <UserManagementView
                    users={users}
                    invitations={invitations}
                    clients={clients}
                    currentUser={currentUser}
                    onSendInvitation={handleSendInvitation}
                    onCreateDirectUser={handleCreateDirectUser}
                    onToggleUserStatus={handleToggleUserStatus}
                  />
                )}
                {activeTab === 'audit' && <AuditLogsView auditLogs={auditLogs} />}
              </>
            )}

            {/* 3. EMPLOYEE PORTAL VIEWS */}
            {activePortalRole === 'employee' && (
              <>
                {activeTab === 'my_tasks' && (
                  <EmployeeDashboard
                    tasks={tasks}
                    deliverables={deliverables}
                    currentUser={currentUser}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onSubmitWork={(t) => setTaskForSubmitWork(t)}
                    onNavigateTab={setActiveTab}
                  />
                )}
                {(activeTab === 'submit_work' ||
                  activeTab === 'feedback_revisions' ||
                  activeTab === 'my_deliverables' ||
                  activeTab === 'activity') && (
                  <EmployeeWorkViews
                    tasks={tasks}
                    deliverables={deliverables}
                    currentUser={currentUser}
                    mode={activeTab as any}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onSubmitWork={(t) => setTaskForSubmitWork(t)}
                  />
                )}
              </>
            )}

            {/* 4. CLIENT PORTAL VIEWS */}
            {activePortalRole === 'client' && (
              <>
                {activeTab === 'client_dashboard' && (
                  <ClientDashboard
                    client={currentClient}
                    projects={projects.filter((p) => p.clientId === currentClient.id)}
                    deliverables={deliverables.filter((d) => d.clientId === currentClient.id)}
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                  />
                )}
                {activeTab === 'commitment_tracker' && (
                  <DeliverableTracker
                    clients={[currentClient]}
                    deliverables={deliverables.filter((d) => d.clientId === currentClient.id)}
                    currentUser={currentUser}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                  />
                )}
                {activeTab === 'approvals' && (
                  <ClientApprovalPanel
                    deliverables={deliverables.filter((d) => d.clientId === currentClient.id)}
                    approvals={approvals.filter((a) => a.clientId === currentClient.id)}
                    currentUser={currentUser}
                    onDecision={handleClientDecision}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                  />
                )}
                {(activeTab === 'calendar' || activeTab === 'asset_library') && (
                  <ClientCalendarAndAssets
                    client={currentClient}
                    deliverables={deliverables}
                    mode={activeTab as any}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {selectedDeliverable && (
        <DeliverableDetailsModal
          deliverable={selectedDeliverable}
          isOpen={!!selectedDeliverable}
          onClose={() => setSelectedDeliverable(null)}
          currentUser={currentUser}
          onUpdateStage={handleAdvanceStage}
          onClientDecision={handleClientDecision}
          onCancelDeliverable={handleCancelDeliverable}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          currentUser={currentUser}
          employees={employees}
          onUpdateStatus={handleUpdateTaskStatus}
          onAddComment={handleAddTaskComment}
          onSubmitWork={(t) => {
            setSelectedTask(null);
            setTaskForSubmitWork(t);
          }}
        />
      )}

      {taskForSubmitWork && (
        <EmployeeSubmitWorkModal
          task={taskForSubmitWork}
          isOpen={!!taskForSubmitWork}
          onClose={() => setTaskForSubmitWork(null)}
          onSubmit={handleSubmitWork}
        />
      )}

      {isCreateClientOpen && (
        <CreateClientModal
          isOpen={isCreateClientOpen}
          onClose={() => {
            setIsCreateClientOpen(false);
            setClientToEdit(null);
          }}
          onSubmit={handleSaveClient}
          clientToEdit={clientToEdit}
        />
      )}

      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          clients={clients}
          projects={projects}
          employees={employees}
          deliverables={deliverables}
          onCreateTask={handleCreateTask}
        />
      )}

      {isCreateEmployeeOpen && (
        <CreateEmployeeModal
          isOpen={isCreateEmployeeOpen}
          onClose={() => {
            setIsCreateEmployeeOpen(false);
            setEmployeeToEdit(null);
          }}
          onSubmit={handleSaveEmployee}
          employeeToEdit={employeeToEdit}
        />
      )}

      {isCreateDeliverableOpen && (
        <CreateDeliverableModal
          isOpen={isCreateDeliverableOpen}
          onClose={() => setIsCreateDeliverableOpen(false)}
          clients={clients}
          projects={projects}
          employees={employees}
          onCreate={handleCreateDeliverable}
        />
      )}

      {/* Slide-over Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
      />
    </div>
  );
}
