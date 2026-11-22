import { User, UserRole, Task } from './types';

/**
 * CRITICAL ARCHITECTURE REQUIREMENT:
 * ADMIN and MANAGER MUST HAVE EQUAL ADMINISTRATIVE PERMISSIONS.
 * Both belong to the shared 'FULL_ADMIN_ACCESS' permission group.
 * There are NO operational or administrative restrictions separating Admin from Manager.
 * There is NO separate Boss role; the Boss operates via the Admin Portal.
 */

export const FULL_ADMIN_ACCESS_ROLES: readonly UserRole[] = ['admin', 'manager'] as const;

export function hasFullAdminAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    user.role === 'manager' ||
    user.permissionGroup === 'FULL_ADMIN_ACCESS'
  );
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
 * Comprehensive Account & Operational Permission Engine:
 * All 29 operational capabilities from Section 2 of the Master Development Prompt.
 * Admin and Manager possess 100% parity across all 29 capabilities.
 */
export const permissions = {
  // 1. Create client accounts
  canCreateClientAccount: (user: User | null | undefined) => hasFullAdminAccess(user),
  canCreateClient: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 2. Create employee accounts
  canCreateEmployeeAccount: (user: User | null | undefined) => hasFullAdminAccess(user),
  canCreateEmployee: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 3. Create other Admin and Manager accounts
  canCreateAdminManagerAccount: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 4. Send invitations and initiate secure password setup
  canSendInvitations: (user: User | null | undefined) => hasFullAdminAccess(user),
  canInitiatePasswordSetup: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 5. Manage usernames and account information
  canManageUsernames: (user: User | null | undefined) => hasFullAdminAccess(user),
  canEditUser: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 6. Activate, deactivate, and manage accounts
  canManageAccountStatus: (user: User | null | undefined) => hasFullAdminAccess(user),
  canDeactivateUser: (user: User | null | undefined) => hasFullAdminAccess(user),
  canActivateUser: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 7. Create, edit, and delete projects where permitted
  canCreateProject: (user: User | null | undefined) => hasFullAdminAccess(user),
  canEditProject: (user: User | null | undefined) => hasFullAdminAccess(user),
  canDeleteProject: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 8. Add and edit clients
  canAddClient: (user: User | null | undefined) => hasFullAdminAccess(user),
  canEditClient: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 9. Manage client services and contracts
  canManageClientServices: (user: User | null | undefined) => hasFullAdminAccess(user),
  canManageClientContracts: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 10. Set monthly deliverable targets
  canSetMonthlyDeliverableTargets: (user: User | null | undefined) => hasFullAdminAccess(user),
  canSetMonthlyTargets: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 11. Assign tasks to any employee
  canAssignTasksToAnyEmployee: (user: User | null | undefined) => hasFullAdminAccess(user),
  canCreateTask: (user: User | null | undefined) => hasFullAdminAccess(user),
  canAssignTask: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 12. Reassign tasks
  canReassignTasks: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 13. Create and manage content calendars
  canManageContentCalendars: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 14. Create and manage scripts
  canManageScripts: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 15. Assign video editing work
  canAssignVideoEditingWork: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 16. Assign graphic design work
  canAssignGraphicDesignWork: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 17. Review submitted work
  canReviewSubmittedWork: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 18. Approve or reject internal submissions
  canApproveRejectInternalSubmissions: (user: User | null | undefined) => hasFullAdminAccess(user),
  canReviewInternalSubmission: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 19. Send scripts and videos to clients for approval
  canSendForClientApproval: (user: User | null | undefined) => hasFullAdminAccess(user),
  canSendToClientForApproval: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 20. Handle client revisions
  canHandleClientRevisions: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 21. Schedule and track content
  canScheduleAndTrackContent: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 22. Mark deliverables as published or delivered
  canMarkDeliverablePublished: (user: User | null | undefined) => hasFullAdminAccess(user),
  canCancelDeliverable: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 23. View all employee activity
  canViewAllEmployeeActivity: (user: User | null | undefined) => hasFullAdminAccess(user),
  canViewEmployeeWorkloads: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 24. View all client activity
  canViewAllClientActivity: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 25. Manage notifications
  canManageNotifications: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 26. View reports and analytics
  canViewReportsAndAnalytics: (user: User | null | undefined) => hasFullAdminAccess(user),
  canViewCompanyReports: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 27. Manage financial and contract information
  canManageFinancialAndContracts: (user: User | null | undefined) => hasFullAdminAccess(user),
  canViewFinancials: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 28. Manage application settings
  canManageApplicationSettings: (user: User | null | undefined) => hasFullAdminAccess(user),
  canManageSettings: (user: User | null | undefined) => hasFullAdminAccess(user),

  // 29. Access all company-wide operational data
  canAccessAllCompanyOperationalData: (user: User | null | undefined) => hasFullAdminAccess(user),
  canViewAuditLogs: (user: User | null | undefined) => hasFullAdminAccess(user),
  canManageWorkflowStages: (user: User | null | undefined) => hasFullAdminAccess(user),

  // EMPLOYEE PORTAL RESTRICTED PERMISSIONS
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

  // CLIENT PORTAL PRIVATE WORKSPACE BOUNDARY RESTRICTIONS
  canAccessClientData: (user: User | null | undefined, clientId: string) => {
    if (!user) return false;
    if (hasFullAdminAccess(user)) return true;
    if (user.role === 'client') {
      return user.clientId === clientId;
    }
    return false;
  },

  canApproveOrRejectDeliverable: (user: User | null | undefined, clientId: string) => {
    if (!user) return false;
    if (user.role === 'client') {
      return user.clientId === clientId;
    }
    return hasFullAdminAccess(user);
  },
};
