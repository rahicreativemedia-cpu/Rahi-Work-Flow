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
  Priority,
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
import { ProjectsAndTasksCenter } from '@/components/projects/ProjectsAndTasksCenter';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
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
import { LoginView } from '@/components/auth/LoginView';
import { InviteAcceptModal } from '@/components/auth/InviteAcceptModal';
import { ResetPasswordModal } from '@/components/auth/ResetPasswordModal';
import { AdminProfileModal } from '@/components/auth/AdminProfileModal';
import { hasFullAdminAccess } from '@/lib/permissions';

export default function FlowdeskApp() {
  // Master State initialized with rich seed data
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Displays login screen by default
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

  // Auth modal states
  const [isInviteAcceptOpen, setIsInviteAcceptOpen] = useState(false);
  const [inviteTokenToClaim, setInviteTokenToClaim] = useState('');
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Modal dialog states
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskForSubmitWork, setTaskForSubmitWork] = useState<Task | null>(null);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [isCreateDeliverableOpen, setIsCreateDeliverableOpen] = useState(false);
  const [trackerClientId, setTrackerClientId] = useState<string>('all');
  const [previewClient, setPreviewClient] = useState<Client | null>(null);

  // Fetch live sync from API on initial load
  const refreshData = async () => {
    if (!currentUser) return;
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
    if (currentUser) {
      refreshData();
    }
  }, [currentUser?.id]);

  // Check URL query parameters for invitation token (?invite=...) & restore persisted session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('rahi_flowdesk_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }

      const params = new URLSearchParams(window.location.search);
      const token = params.get('invite');
      if (token) {
        setInviteTokenToClaim(token);
        setIsInviteAcceptOpen(true);
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rahi_flowdesk_user', JSON.stringify(user));
      } catch (e) {
        console.error('Failed to save user session:', e);
      }
    }
    setCurrentUser(user);
    if (user.role === 'admin' || user.role === 'manager') {
      setActiveTab('overview');
    } else if (user.role === 'employee') {
      setActiveTab('my_tasks');
    } else if (user.role === 'client') {
      setActiveTab('client_dashboard');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('rahi_flowdesk_user');
      } catch (e) {
        console.error('Failed to remove user session:', e);
      }
    }
    setCurrentUser(null);
  };

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
          callerUserId: currentUser?.id || 'sys',
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
    feedback: string,
    categories?: string[]
  ) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerUserId: currentUser?.id || 'sys',
          deliverableId,
          approvalType,
          decision,
          feedback,
          categories,
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
          callerUserId: currentUser?.id || 'sys',
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

  // Upload New Deliverable Version
  const handleUploadDeliverableVersion = async (
    deliverableId: string,
    versionData: { mediaUrl?: string; scriptText?: string; notes?: string }
  ) => {
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_version',
          callerUserId: currentUser?.id || 'sys',
          deliverableId,
          ...versionData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshData();
        if (selectedDeliverable && selectedDeliverable.id === deliverableId) {
          setSelectedDeliverable(data.deliverable);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Deliverable Script Draft
  const handleUpdateDeliverableScript = async (
    deliverableId: string,
    scriptText: string
  ) => {
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_script',
          callerUserId: currentUser?.id || 'sys',
          deliverableId,
          scriptText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshData();
        if (selectedDeliverable && selectedDeliverable.id === deliverableId) {
          setSelectedDeliverable(data.deliverable);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Deliverable Media Asset Link
  const handleUpdateDeliverableMedia = async (
    deliverableId: string,
    mediaUrl: string
  ) => {
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_media',
          callerUserId: currentUser?.id || 'sys',
          deliverableId,
          mediaUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshData();
        if (selectedDeliverable && selectedDeliverable.id === deliverableId) {
          setSelectedDeliverable(data.deliverable);
        }
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
          callerUserId: currentUser?.id || 'sys',
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
          callerUserId: currentUser?.id || 'sys',
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
          callerUserId: currentUser?.id || 'sys',
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
          callerUserId: currentUser?.id || 'sys',
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

  // Toggle Client Status (Admin & Manager Equal Access)
  const handleToggleClientStatus = async (client: Client) => {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerUserId: currentUser?.id || 'sys',
          id: client.id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Project (Admin & Manager Equal Access)
  const handleSaveProject = async (projectData: any) => {
    try {
      const method = projectData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerUserId: currentUser?.id || 'sys',
          ...projectData,
        }),
      });
      if (res.ok) {
        await refreshData();
        setProjectToEdit(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Archive Project (Admin & Manager Equal Access)
  const handleArchiveProject = async (projectId: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          callerUserId: currentUser?.id || 'sys',
          id: projectId,
        }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Restore Project (Admin & Manager Equal Access)
  const handleRestoreProject = async (projectId: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          callerUserId: currentUser?.id || 'sys',
          id: projectId,
        }),
      });
      if (res.ok) {
        await refreshData();
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
          callerUserId: currentUser?.id || 'sys',
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

  // Deactivate Employee (Admin & Manager Equal Access)
  const handleDeactivateEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to deactivate ${employee.name}? Their login will be disabled but past records will be preserved.`)) return;
    try {
      const res = await fetch('/api/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: employee.id }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reassign Task (Admin & Manager Equal Access)
  const handleReassignTask = async (
    taskId: string,
    newEmployeeId: string,
    priority?: Priority,
    deadline?: string
  ) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          assignedEmployeeId: newEmployeeId,
          priority,
          deadline,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.warning) {
          alert(data.warning);
        }
        await refreshData();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(data.task);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cancel Task (Admin & Manager Equal Access)
  const handleCancelTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });
      if (res.ok) {
        await refreshData();
        setSelectedTask(null);
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
          callerUserId: currentUser?.id || 'sys',
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
          callerUserId: currentUser?.id || 'sys',
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
          callerUserId: currentUser?.id || 'sys',
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
          callerUserId: currentUser?.id || 'sys',
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
          callerUserId: currentUser?.id || 'sys',
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
          userId: currentUser?.id || '',
        }),
      });
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <>
        <LoginView
          allUsers={users}
          onLogin={handleLogin}
          onOpenInviteModal={() => {
            setInviteTokenToClaim('');
            setIsInviteAcceptOpen(true);
          }}
          onOpenResetPasswordModal={() => setIsResetPasswordOpen(true)}
        />
        <InviteAcceptModal
          isOpen={isInviteAcceptOpen}
          onClose={() => setIsInviteAcceptOpen(false)}
          token={inviteTokenToClaim}
          onSuccess={handleLogin}
        />
        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
        />
      </>
    );
  }

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

  // ADMIN PREVIEW MODE: Displays read-only Client Portal with persistent top exit banner
  if (previewClient) {
    return (
      <div className="h-screen overflow-y-auto">
        <ClientDashboard
          client={previewClient}
          projects={projects.filter((p) => p.clientId === previewClient.id)}
          deliverables={deliverables.filter((d) => d.clientId === previewClient.id)}
          currentUser={currentUser}
          onNavigateTab={(tab) => {
            if (tab === 'commitment_tracker') {
              setTrackerClientId(previewClient.id);
              setActiveTab('deliverable_tracker');
              setPreviewClient(null);
            } else if (tab === 'approvals') {
              setActiveTab('approvals');
              setPreviewClient(null);
            } else if (tab === 'projects_tasks') {
              setActiveTab('projects_tasks');
              setPreviewClient(null);
            }
          }}
          onSelectDeliverable={(d) => setSelectedDeliverable(d)}
          isPreviewMode={true}
          onExitPreview={() => setPreviewClient(null)}
        />
        {selectedDeliverable && (
          <DeliverableDetailsModal
            deliverable={selectedDeliverable}
            isOpen={!!selectedDeliverable}
            onClose={() => setSelectedDeliverable(null)}
            currentUser={currentUser}
            onUpdateStage={handleAdvanceStage}
            onClientDecision={handleClientDecision}
            onCancelDeliverable={handleCancelDeliverable}
            onUploadVersion={handleUploadDeliverableVersion}
            onUpdateScript={handleUpdateDeliverableScript}
            onUpdateMedia={handleUpdateDeliverableMedia}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen liquid-glass-canvas text-[#1C1917] overflow-hidden font-sans">
      {/* Top Header (Full Width matching Planex Reference) */}
      <AppHeader
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onResetDB={handleResetDB}
        activePortal={activePortalRole}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onLogout={handleLogout}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Container: Floating Left Sidebar + Dashboard Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Minimal Floating Icon Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingApprovalsCount={pendingApprovalsCount}
          overdueTasksCount={overdueTasksCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-2 pb-8">
          <div className="max-w-[1440px] mx-auto space-y-5">
            {/* 1. ADMIN PORTAL VIEWS */}
            {activePortalRole === 'admin' && (
              <>
                {activeTab === 'overview' && (
                  <AdminDashboard
                    clients={clients}
                    employees={employees}
                    deliverables={deliverables}
                    tasks={tasks}
                    projects={projects}
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onSelectProject={(p) => setSelectedProject(p)}
                    onCreateClient={() => {
                      setClientToEdit(null);
                      setIsCreateClientOpen(true);
                    }}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                    onCreateProject={() => {
                      setProjectToEdit(null);
                      setIsCreateProjectOpen(true);
                    }}
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
                    selectedClientId={trackerClientId}
                    onClientFilterChange={setTrackerClientId}
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
                    onSelectClientDeliverables={(c) => {
                      setTrackerClientId(c.id);
                      setActiveTab('deliverable_tracker');
                    }}
                    onToggleStatus={handleToggleClientStatus}
                    onPreviewClient={(c) => setPreviewClient(c)}
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
                    onDeactivateEmployee={handleDeactivateEmployee}
                  />
                )}
                {activeTab === 'projects_tasks' && (
                  <ProjectsAndTasksCenter
                    projects={projects}
                    tasks={tasks}
                    clients={clients}
                    employees={employees}
                    currentUser={currentUser}
                    onSelectProject={(p) => setSelectedProject(p)}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onCreateProject={() => {
                      setProjectToEdit(null);
                      setIsCreateProjectOpen(true);
                    }}
                    onEditProject={(p) => {
                      setProjectToEdit(p);
                      setIsCreateProjectOpen(true);
                    }}
                    onArchiveProject={handleArchiveProject}
                    onRestoreProject={handleRestoreProject}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onSubmitWork={(t) => setTaskForSubmitWork(t)}
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
                    projects={projects}
                    currentUser={currentUser}
                    onNavigateTab={setActiveTab}
                    onSelectDeliverable={(d) => setSelectedDeliverable(d)}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onSelectProject={(p) => setSelectedProject(p)}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                    onCreateClient={() => {
                      setClientToEdit(null);
                      setIsCreateClientOpen(true);
                    }}
                    onCreateDeliverable={() => setIsCreateDeliverableOpen(true)}
                    onCreateProject={() => {
                      setProjectToEdit(null);
                      setIsCreateProjectOpen(true);
                    }}
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
                    selectedClientId={trackerClientId}
                    onClientFilterChange={setTrackerClientId}
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
                    onSelectClientDeliverables={(c) => {
                      setTrackerClientId(c.id);
                      setActiveTab('deliverable_tracker');
                    }}
                    onToggleStatus={handleToggleClientStatus}
                    onPreviewClient={(c) => setPreviewClient(c)}
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
                    onDeactivateEmployee={handleDeactivateEmployee}
                  />
                )}
                {activeTab === 'projects_tasks' && (
                  <ProjectsAndTasksCenter
                    projects={projects}
                    tasks={tasks}
                    clients={clients}
                    employees={employees}
                    currentUser={currentUser}
                    onSelectProject={(p) => setSelectedProject(p)}
                    onSelectTask={(t) => setSelectedTask(t)}
                    onCreateProject={() => {
                      setProjectToEdit(null);
                      setIsCreateProjectOpen(true);
                    }}
                    onEditProject={(p) => {
                      setProjectToEdit(p);
                      setIsCreateProjectOpen(true);
                    }}
                    onArchiveProject={handleArchiveProject}
                    onRestoreProject={handleRestoreProject}
                    onCreateTask={() => setIsCreateTaskOpen(true)}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onSubmitWork={(t) => setTaskForSubmitWork(t)}
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
                {activeTab === 'projects_tasks' && (
                  <ProjectsAndTasksCenter
                    projects={projects}
                    tasks={tasks}
                    clients={clients}
                    employees={employees}
                    currentUser={currentUser}
                    onSelectProject={(p) => setSelectedProject(p)}
                    onSelectTask={(t) => setSelectedTask(t)}
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
          onUploadVersion={handleUploadDeliverableVersion}
          onUpdateScript={handleUpdateDeliverableScript}
          onUpdateMedia={handleUpdateDeliverableMedia}
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
          onReassignTask={handleReassignTask}
          onCancelTask={handleCancelTask}
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

      {isCreateProjectOpen && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => {
            setIsCreateProjectOpen(false);
            setProjectToEdit(null);
          }}
          clients={clients}
          employees={employees}
          users={users}
          currentUser={currentUser}
          projectToEdit={projectToEdit}
          onSaveProject={handleSaveProject}
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

      {/* Global Auth Modals */}
      <InviteAcceptModal
        isOpen={isInviteAcceptOpen}
        onClose={() => setIsInviteAcceptOpen(false)}
        token={inviteTokenToClaim}
        onSuccess={handleLogin}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
      />

      {isProfileModalOpen && currentUser && (
        <AdminProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            refreshData();
          }}
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
