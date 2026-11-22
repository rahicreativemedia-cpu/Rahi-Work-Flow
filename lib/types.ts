export type UserRole = 'admin' | 'manager' | 'employee' | 'client';

export type PermissionGroup = 'FULL_ADMIN_ACCESS' | 'EMPLOYEE_ACCESS' | 'CLIENT_ACCESS';

export type Department =
  | 'Video Production'
  | 'Video Editing'
  | 'Graphic Design'
  | 'Scriptwriting'
  | 'Social Media'
  | 'Content Planning'
  | 'Creative Direction'
  | 'Operations';

export type ServicePackage =
  | 'Full Marketing'
  | 'Video Editing Only'
  | 'Marketing Management Only'
  | 'Custom Retainer';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'revision'
  | 'completed';

export type CreativeWorkflowStage =
  | 'content_planning'
  | 'scriptwriting'
  | 'internal_script_review'
  | 'client_script_approval'
  | 'video_editing'
  | 'internal_video_review'
  | 'client_video_approval'
  | 'revisions'
  | 'scheduling'
  | 'publishing_or_delivery';

export const WORKFLOW_STAGE_METADATA: Record<
  CreativeWorkflowStage,
  { label: string; step: number; description: string; color: string }
> = {
  content_planning: {
    step: 1,
    label: 'Content Planning',
    description: 'Ideation, research, hooks, and content angle mapping',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  scriptwriting: {
    step: 2,
    label: 'Scriptwriting',
    description: 'Drafting voiceover, text on screen, and visual cues',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  internal_script_review: {
    step: 3,
    label: 'Internal Script Review',
    description: 'Quality review by Manager or Creative Lead',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  client_script_approval: {
    step: 4,
    label: 'Client Script Approval',
    description: 'Client review for script sign-off or revisions',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  video_editing: {
    step: 5,
    label: 'Video Editing',
    description: 'Rough cut, pacing, motion graphics, audio & color grade',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  internal_video_review: {
    step: 6,
    label: 'Internal Video Review',
    description: 'Creative check against RAHI quality benchmark',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  client_video_approval: {
    step: 7,
    label: 'Client Video Approval',
    description: 'Client preview & final creative sign-off or feedback',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  revisions: {
    step: 8,
    label: 'Revisions',
    description: 'Executing requested adjustments and polish',
    color: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  scheduling: {
    step: 9,
    label: 'Scheduling',
    description: 'Slotting into calendar, captions, hashtags & tags',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  publishing_or_delivery: {
    step: 10,
    label: 'Publishing / Final Delivery',
    description: 'Live publication or final master asset delivered to client',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export type DeliverableType =
  | 'reel'
  | 'long_video'
  | 'carousel'
  | 'graphic'
  | 'script'
  | 'brand_asset';

export type DeliverableStatus =
  | 'in_progress'
  | 'internal_review'
  | 'client_review'
  | 'revision_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'delivered'
  | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  permissionGroup: PermissionGroup;
  department?: Department;
  clientId?: string;
  clientName?: string;
  employeeId?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  phone?: string;
  passwordHash?: string;
  createdAt: string;
}

export interface ClientMonthlyCommitment {
  reels: number;
  longVideos: number;
  graphics: number;
  carousels: number;
  customTargetNote?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  logoUrl?: string;
  servicePackage: ServicePackage;
  contractStartDate: string;
  contractEndDate: string;
  monthlyRetainer: number;
  currency: string;
  monthlyCommitment: ClientMonthlyCommitment;
  status: 'active' | 'inactive' | 'archived';
  archivedAt?: string;
  archivedByUserId?: string;
  primaryContactName: string;
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  status: 'active' | 'inactive';
  maxConcurrentTasks: number;
  currentActiveTasks: number;
  joinedDate: string;
  performanceScore: number; // percentage e.g. 98
  skills: string[];
  deactivatedAt?: string;
  deactivatedByUserId?: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  assignedEmployees: string[]; // employee user ids or employee ids
  totalDeliverablesTarget: number;
  completedDeliverablesCount: number;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  submittedAt: string;
  submittedByUserId: string;
  submittedByUserName: string;
  notes?: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectTitle: string;
  deliverableId?: string;
  description: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  assignedEmployeeDepartment: Department;
  priority: Priority;
  startDate: string;
  deadline: string;
  status: TaskStatus;
  referenceFiles: { name: string; url: string; size: string }[];
  requiredOutput: string;
  submissions: TaskSubmission[];
  comments: TaskComment[];
  feedbackNotes?: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledByUserId?: string;
}

export interface DeliverableVersion {
  version: number;
  scriptText?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  submittedAt: string;
  notes?: string;
}

export interface Deliverable {
  id: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectTitle: string;
  title: string;
  type: DeliverableType;
  targetMonth: string; // format: "YYYY-MM"
  stage: CreativeWorkflowStage;
  currentVersion: number;
  scriptText?: string;
  scriptApproved: boolean;
  scriptApprovedAt?: string;
  videoApproved: boolean;
  videoApprovedAt?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  deadline: string;
  scheduledPublishDate?: string;
  status: DeliverableStatus;
  // A deliverable counts towards monthly commitment ONLY when reaching publishing_or_delivery and marked published or delivered
  isCountedTowardsCommitment: boolean;
  versions: DeliverableVersion[];
  createdAt: string;
  publishedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface ClientApprovalRecord {
  id: string;
  clientId: string;
  clientName: string;
  deliverableId: string;
  deliverableTitle: string;
  type: 'script' | 'video' | 'design';
  version: number;
  status: 'approved' | 'revision_requested';
  action: 'script_approved' | 'script_revision' | 'video_approved' | 'video_revision';
  feedback: string;
  decisionDate: string;
  decidedByUserId: string;
  decidedByUserName: string;
}

export interface NotificationItem {
  id: string;
  targetRole: 'all_admin' | 'employee' | 'client' | 'specific_user';
  recipientUserId?: string;
  recipientClientId?: string;
  title: string;
  message: string;
  type:
    | 'assignment'
    | 'deadline'
    | 'overdue'
    | 'submission'
    | 'internal_review'
    | 'client_approval'
    | 'client_revision'
    | 'published'
    | 'target_warning';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: UserRole;
  department?: Department;
  clientId?: string;
  clientName?: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface UserSession {
  id: string;
  token: string;
  userId: string;
  role: UserRole;
  permissionGroup: PermissionGroup;
  clientId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  targetType: 'client' | 'employee' | 'project' | 'task' | 'deliverable' | 'approval' | 'auth' | 'settings';
  targetId?: string;
  timestamp: string;
}

export interface AppState {
  users: User[];
  clients: Client[];
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  deliverables: Deliverable[];
  approvals: ClientApprovalRecord[];
  notifications: NotificationItem[];
  invitations: Invitation[];
  auditLogs: AuditLog[];
  passwordResets?: PasswordResetToken[];
  sessions?: UserSession[];
}
