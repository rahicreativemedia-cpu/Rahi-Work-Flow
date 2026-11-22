import { User, UserRole, Task } from './types';

/**
 * CRITICAL ARCHITECTURE REQUIREMENT:
 * ADMIN and MANAGER MUST HAVE EQUAL ADMINISTRATIVE PERMISSIONS.
 * Both belong to the shared 'FULL_ADMIN_ACCESS' permission group.
 * There are NO operational or administrative restrictions separating Admin from Manager.
 * There is NO separate Boss role; the Boss operates via the Admin Portal.
 * 
 * Account Status Requirement:
 * Inactive/deactivated accounts are strictly revoked across all permissions.
 */

export const FULL_ADMIN_ACCESS_ROLES: readonly UserRole[] = ['admin', 'manager'] as const;

export function hasFullAdminAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  // Server-side deactivation enforcement: Inactive accounts have ZERO access
  if (user.status === 'inactive') return false;
  return (
    user.role === 'admin' ||
    user.role === 'manager' ||
    user.permissionGroup === 'FULL_ADMIN_ACCESS'
  );
}

export function isEmployee(user: User | null | undefined): boolean {
  if (!user || user.status === 'inactive') return false;
  return user.role === 'employee';
}

export function isClient(user: User | null | undefined): boolean {
  if (!user || user.status === 'inactive') return false;
  return user.role === 'client';
}

/**
 * The 29 Canonical Capabilities from Section 2 ("Equal Permissions Implementation")
 * of the Master Development Prompt:
 */
export const MASTER_29_CAPABILITIES = [
  '1_create_client_accounts',
  '2_create_employee_accounts',
  '3_create_admin_and_manager_accounts',
  '4_send_invitations_and_password_setup',
  '5_manage_usernames_and_account_info',
  '6_activate_deactivate_and_manage_accounts',
  '7_create_edit_and_delete_projects',
  '8_add_and_edit_clients',
  '9_manage_client_services_and_contracts',
  '10_set_monthly_deliverable_targets',
  '11_assign_tasks_to_any_employee',
  '12_reassign_tasks',
  '13_create_and_manage_content_calendars',
  '14_create_and_manage_scripts',
  '15_assign_video_editing_work',
  '16_assign_graphic_design_work',
  '17_review_submitted_work',
  '18_approve_or_reject_internal_submissions',
  '19_send_scripts_and_videos_to_clients_for_approval',
  '20_handle_client_revisions',
  '21_schedule_and_track_content',
  '22_mark_deliverables_as_published_or_delivered',
  '23_view_all_employee_activity',
  '24_view_all_client_activity',
  '25_manage_notifications',
  '26_view_reports_and_analytics',
  '27_manage_financial_and_contract_information',
  '28_manage_application_settings',
  '29_access_all_company_wide_operational_data',
] as const;

export type MasterCapability = typeof MASTER_29_CAPABILITIES[number];

/**
 * Master Permission Checker for the 29 capabilities.
 * Guarantees 100% parity: whatever Admin can do, Manager can do.
 */
export function checkCapability(user: User | null | undefined, capability: MasterCapability): boolean {
  if (!user || user.status === 'inactive') return false;
  // All 29 administrative capabilities are granted to FULL_ADMIN_ACCESS (Admin & Manager)
  return hasFullAdminAccess(user);
}

/**
 * Detailed permission helper functions used across UI and API endpoints.
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
    if (!user || user.status === 'inactive') return false;
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
    if (!user || user.status === 'inactive') return false;
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
    if (!user || user.status === 'inactive') return false;
    if (hasFullAdminAccess(user)) return true;
    if (user.role === 'client') {
      return user.clientId === clientId;
    }
    return false;
  },

  canApproveOrRejectDeliverable: (user: User | null | undefined, clientId: string) => {
    if (!user || user.status === 'inactive') return false;
    if (user.role === 'client') {
      return user.clientId === clientId;
    }
    return hasFullAdminAccess(user);
  },
};
