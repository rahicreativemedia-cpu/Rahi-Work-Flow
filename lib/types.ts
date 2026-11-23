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
  | 'Video Production Only'
  | 'Video Editing Only'
  | 'Marketing Management Only'
  | 'Custom Service Package'
  | 'Custom Retainer';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'under_review'
  | 'in_review'
  | 'revision_required'
  | 'revision'
  | 'approved'
  | 'completed'
  | 'cancelled';

export type ProjectStatus =
  | 'planning'
  | 'not_started'
  | 'active'
  | 'in_progress'
  | 'review'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'archived';

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
    color: 'bg-neutral-100 text-neutral-900 border-neutral-300',
  },
  scriptwriting: {
    step: 2,
    label: 'Scriptwriting',
    description: 'Drafting voiceover, text on screen, and visual cues',
    color: 'bg-neutral-100 text-neutral-900 border-neutral-300',
  },
  internal_script_review: {
    step: 3,
    label: 'Internal Script Review',
    description: 'Quality review by Manager or Creative Lead',
    color: 'bg-neutral-100 text-neutral-900 border-neutral-300',
  },
  client_script_approval: {
    step: 4,
    label: 'Client Script Approval',
    description: 'Client review for script sign-off or revisions',
    color: 'bg-rose-50 text-rose-900 border-rose-200',
  },
  video_editing: {
    step: 5,
    label: 'Video Editing',
    description: 'Rough cut, pacing, motion graphics, audio & color grade',
    color: 'bg-stone-100 text-stone-900 border-stone-200',
  },
  internal_video_review: {
    step: 6,
    label: 'Internal Video Review',
    description: 'Creative check against RAHI quality benchmark',
    color: 'bg-stone-100 text-stone-900 border-stone-200',
  },
  client_video_approval: {
    step: 7,
    label: 'Client Video Approval',
    description: 'Client preview & final creative sign-off or feedback',
    color: 'bg-rose-50 text-rose-900 border-rose-200',
  },
  revisions: {
    step: 8,
    label: 'Revisions',
    description: 'Executing requested adjustments and polish',
    color: 'bg-rose-100 text-rose-950 border-rose-300 font-medium',
  },
  scheduling: {
    step: 9,
    label: 'Scheduling',
    description: 'Slotting into calendar, captions, hashtags & tags',
    color: 'bg-stone-100 text-stone-900 border-stone-200',
  },
  publishing_or_delivery: {
    step: 10,
    label: 'Publishing / Final Delivery',
    description: 'Live publication or final master asset delivered to client',
    color: 'bg-gradient-to-r from-rose-950 to-rose-900 text-rose-100 border-rose-800 font-bold',
  },
};

export type DeliverableType =
  | 'reel'
  | 'marketing_reel'
  | 'post'
  | 'carousel'
  | 'showreel'
  | 'long_video'
  | 'graphic' // backwards compatible alias for post
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

export interface WeeklyCommitment {
  reels: number;
  marketingReels: number;
  showreels: number;
  longVideos: number;
  weekStartDay?: 'Monday' | 'Sunday';
  deadlineDay?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
}

export interface ClientMonthlyCommitment {
  reels: number;
  marketingReels?: number;
  posts?: number; // Replaces graphics in user-facing UI
  graphics?: number; // Preserved for backwards compatibility
  carousels: number;
  showreels?: number;
  longVideos: number;
  customTargetNote?: string;
  trackingFrequency?: 'monthly' | 'weekly';
  weeklyCommitment?: WeeklyCommitment;
  weeklyDeadlineDay?: string; // e.g. 'Friday'
}

export interface CategoryDeliverableStats {
  categoryKey: 'reels' | 'marketingReels' | 'posts' | 'carousels' | 'showreels' | 'longVideos';
  label: string;
  target: number;
  completed: number;
  pending: number; // max(0, target - completed)
  inProduction: number;
  awaitingApproval: number;
  overdue: number;
}

export interface WeeklyPeriodStats {
  weekNumber: number;
  label: string; // e.g. "Week 1"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  dueDate: string; // "YYYY-MM-DD"
  dueDayName: string; // e.g. "Friday"
  targetVideos: number;
  completedVideos: number;
  pendingVideos: number;
  inProduction: number;
  awaitingApproval: number;
  overdueVideos: number;
  completionPercentage: number;
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
  objective?: string;
  startDate: string;
  targetEndDate: string; // deadline
  priority?: Priority;
  status: ProjectStatus;
  assignedEmployees: string[]; // employee user ids or employee ids
  projectManagerId?: string;
  projectManagerName?: string;
  budget?: number;
  currency?: string;
  progress?: number; // 0-100%
  totalDeliverablesTarget: number;
  completedDeliverablesCount: number;
  createdAt: string;
  archivedAt?: string;
  archivedByUserId?: string;
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
  assignedEmployeeIds?: string[];
  priority: Priority;
  startDate: string;
  deadline: string;
  estimatedHours?: number;
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
  submittedByUserId?: string;
  submittedByUserName?: string;
  feedback?: string;
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
  categories?: string[];
  decisionDate: string;
  decidedByUserId: string;
  decidedByUserName: string;
  recordedByAdminOrManager?: boolean;
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: 'INR' | 'USD' | 'AED' | 'EUR' | 'GBP';
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  paidAmount: number;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId?: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: 'INR' | 'USD' | 'AED' | 'EUR' | 'GBP';
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'upi' | 'credit_card' | 'stripe' | 'wire' | 'cash';
  transactionReference: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'software' | 'production' | 'freelancer' | 'travel' | 'equipment' | 'marketing' | 'office' | 'other';
  amount: number;
  currency: 'INR' | 'USD' | 'AED' | 'EUR' | 'GBP';
  date: string;
  recordedByUserId: string;
  notes?: string;
  createdAt: string;
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
  invoices?: Invoice[];
  payments?: PaymentRecord[];
  expenses?: ExpenseRecord[];
}
