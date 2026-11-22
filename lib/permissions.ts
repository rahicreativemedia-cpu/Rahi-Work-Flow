import { User, UserRole, Task } from './types';

/**
 * CRITICAL ARCHITECTURE REQUIREMENT:
 * ADMIN and MANAGER MUST HAVE EQUAL ADMINISTRATIVE PERMISSIONS.
 * Both belong to the shared 'FULL_ADMIN_ACCESS' permission group.
 * There are NO operational or administrative restrictions separating Admin from Manager.
 */

export const FULL_ADMIN_ACCESS_ROLES: readonly UserRole[] = ['admin', 'manager'] as const;

export function hasFullAdminAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager' || user.permissionGroup === 'FULL_ADMIN_ACCESS';
}

export function isEmployee(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'employee';
}

export function isClient(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'client';
}

/**
 * Account & System Permission Checks:
 * Both Admin and Manager have 100% parity across all capabilities.
 */
export const permissions = {
  // Account & User Management
  canCreateUser: (user: User | null | undefined) => hasFullAdminAccess(user),
  canEditUser: (user: User | null | undefined) => hasFullAdminAccess(user),
  canDeactivateUser: (user: User | null | undefined) => hasFullAdminAccess(user),
  canSendInvitations: (user: User | null | undefined) => hasFullAdminAccess(user),

  // Client Management
  canCreateClient: (user: User | null | undefined) => hasFullAdminAccess(user),
  canEditClient: (user: User | null | undefined) => hasFullAdminAccess(user),
  canDeactivateClient: (user: User | null | undefined) => hasFullAdminAccess(user),
  canManageClientContracts: (user: User | null | undefined) => hasFullAdminAccess(user),
  canSetMonthlyTargets: (user: User | null | undefined) => hasFullAdminAccess(user),

  // Employee Management
  canCreateEmployee: (user: User | null | undefined) => hasFullAdminAccess(user),
  canEditEmployee: (user: User | null | undefined) => hasFullAdminAccess(user),
  canViewEmployeeWorkloads: (user: User | null | undefined) => hasFullAdminAccess(user),

  // Projects & Tasks
  canCreateProject: (user: User | null | undefined) => hasFullAdminAccess(user),
  canEditProject: (user: User | null | undefined) => hasFullAdminAccess(user),
  canDeleteProject: (user: User | null | undefined) => hasFullAdminAccess(user),
  canCreateTask: (user: User | null | undefined) => hasFullAdminAccess(user),
  canAssignTask: (user: User | null | undefined) => hasFullAdminAccess(user),
  canReassignTask: (user: User | null | undefined) => hasFullAdminAccess(user),

  // Creative Pipeline & Production Workflow
  canManageWorkflowStages: (user: User | null | undefined) => hasFullAdminAccess(user),
  canReviewInternalSubmission: (user: User | null | undefined) => hasFullAdminAccess(user),
  canSendToClientForApproval: (user: User | null | undefined) => hasFullAdminAccess(user),
  canMarkDeliverablePublished: (user: User | null | undefined) => hasFullAdminAccess(user),
  canCancelDeliverable: (user: User | null | undefined) => hasFullAdminAccess(user),

  // Reports, Financials & Company Overview
  canViewFinancials: (user: User | null | undefined) => hasFullAdminAccess(user),
  canViewCompanyReports: (user: User | null | undefined) => hasFullAdminAccess(user),
  canManageSettings: (user: User | null | undefined) => hasFullAdminAccess(user),
  canViewAuditLogs: (user: User | null | undefined) => hasFullAdminAccess(user),

  // Employee Specific Capabilities
  canSubmitTaskWork: (user: User | null | undefined, task: Task) => {
    if (!user) return false;
    if (hasFullAdminAccess(user)) return true;
    if (user.role === 'employee') {
      return (
        user.employeeId === task.assignedEmployeeId ||
        user.id === task.assignedEmployeeId ||
        user.name === task.assignedEmployeeName
      );
    }
    return false;
  },

  canViewTask: (user: User | null | undefined, task: Task) => {
    if (!user) return false;
    if (hasFullAdminAccess(user)) return true;
    if (user.role === 'employee') {
      return (
        user.employeeId === task.assignedEmployeeId ||
        user.id === task.assignedEmployeeId ||
        user.name === task.assignedEmployeeName
      );
    }
    return false;
  },

  // Client Boundary Restrictions
  canAccessClientData: (user: User | null | undefined, clientId: string) => {
    if (!user) return false;
    if (hasFullAdminAccess(user)) return true;
    if (user.role === 'client') {
      return user.clientId === clientId;
    }
    // Employee can only access if they have an active task for this client
    return false;
  },

  canApproveOrRejectDeliverable: (user: User | null | undefined, clientId: string) => {
    if (!user) return false;
    // Clients can approve their own deliverables; Admins/Managers can also take client action on behalf/testing
    if (user.role === 'client') {
      return user.clientId === clientId;
    }
    return hasFullAdminAccess(user);
  },
};
