import {
  User,
  Client,
  Employee,
  Project,
  Task,
  Deliverable,
  ClientApprovalRecord,
  NotificationItem,
  Invitation,
  AuditLog,
  UserSession,
  Invoice,
  PaymentRecord,
  ExpenseRecord,
  PasswordResetToken,
  AppState,
} from './types';
import { supabaseAdmin, isSupabaseServerConfigured } from './supabase';

/**
 * Ensures Supabase server-side connection is ready.
 * Throws a clear configuration error if credentials are absent.
 */
function assertSupabaseReady() {
  if (!isSupabaseServerConfigured()) {
    throw new Error(
      'Database Error: Supabase PostgreSQL is not configured. Verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }
}

// ============================================================================
// 1. USERS REPOSITORY
// ============================================================================

export async function getUsers(): Promise<User[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch users: ${error.message}`);
  return (data || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    role: u.role,
    permissionGroup: u.permission_group,
    department: u.department,
    clientId: u.client_id,
    clientName: u.client_name,
    employeeId: u.employee_id,
    avatar: u.avatar,
    status: u.status,
    phone: u.phone,
    passwordHash: u.password_hash,
    createdAt: u.created_at,
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch user by id: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    permissionGroup: data.permission_group,
    department: data.department,
    clientId: data.client_id,
    clientName: data.client_name,
    employeeId: data.employee_id,
    avatar: data.avatar,
    status: data.status,
    phone: data.phone,
    passwordHash: data.password_hash,
    createdAt: data.created_at,
  };
}

export async function getUserByEmailOrUsername(identifier: string): Promise<User | null> {
  assertSupabaseReady();
  const clean = identifier.toLowerCase().trim();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .or(`email.ilike.${clean},username.ilike.${clean}`)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch user: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    permissionGroup: data.permission_group,
    department: data.department,
    clientId: data.client_id,
    clientName: data.client_name,
    employeeId: data.employee_id,
    avatar: data.avatar,
    status: data.status,
    phone: data.phone,
    passwordHash: data.password_hash,
    createdAt: data.created_at,
  };
}

export async function createUser(user: User): Promise<User> {
  assertSupabaseReady();
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase().trim(),
    username: user.username.toLowerCase().trim(),
    role: user.role,
    permission_group: user.permissionGroup,
    department: user.department,
    client_id: user.clientId,
    client_name: user.clientName,
    employee_id: user.employeeId,
    avatar: user.avatar,
    status: user.status || 'active',
    phone: user.phone || '',
    password_hash: user.passwordHash,
    created_at: user.createdAt || new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from('users').insert(payload).select().single();
  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return user;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email.toLowerCase().trim();
  if (updates.username !== undefined) payload.username = updates.username.toLowerCase().trim();
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.permissionGroup !== undefined) payload.permission_group = updates.permissionGroup;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.clientId !== undefined) payload.client_id = updates.clientId;
  if (updates.clientName !== undefined) payload.client_name = updates.clientName;
  if (updates.employeeId !== undefined) payload.employee_id = updates.employeeId;
  if (updates.avatar !== undefined) payload.avatar = updates.avatar;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.passwordHash !== undefined) payload.password_hash = updates.passwordHash;

  const { data, error } = await supabaseAdmin.from('users').update(payload).eq('id', id).select().single();
  if (error) throw new Error(`Failed to update user: ${error.message}`);
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete user: ${error.message}`);
  return true;
}

// ============================================================================
// 2. CLIENTS REPOSITORY
// ============================================================================

export async function getClients(): Promise<Client[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch clients: ${error.message}`);
  return (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone || '',
    logoUrl: c.logo_url,
    servicePackage: c.service_package,
    contractStartDate: c.contract_start_date,
    contractEndDate: c.contract_end_date,
    monthlyRetainer: Number(c.monthly_retainer) || 0,
    currency: c.currency || 'INR',
    monthlyCommitment: c.monthly_commitment || {},
    status: c.status,
    primaryContactName: c.primary_contact_name,
    notes: c.notes,
    archivedAt: c.archived_at,
    archivedByUserId: c.archived_by_user_id,
    createdAt: c.created_at,
  }));
}

export async function getClientById(id: string): Promise<Client | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch client: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone || '',
    logoUrl: data.logo_url,
    servicePackage: data.service_package,
    contractStartDate: data.contract_start_date,
    contractEndDate: data.contract_end_date,
    monthlyRetainer: Number(data.monthly_retainer) || 0,
    currency: data.currency || 'INR',
    monthlyCommitment: data.monthly_commitment || {},
    status: data.status,
    primaryContactName: data.primary_contact_name,
    notes: data.notes,
    archivedAt: data.archived_at,
    archivedByUserId: data.archived_by_user_id,
    createdAt: data.created_at,
  };
}

export async function createClient(client: Client): Promise<Client> {
  assertSupabaseReady();
  const payload = {
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email.toLowerCase().trim(),
    phone: client.phone || '',
    logo_url: client.logoUrl,
    service_package: client.servicePackage,
    contract_start_date: client.contractStartDate,
    contract_end_date: client.contractEndDate,
    monthly_retainer: client.monthlyRetainer,
    currency: client.currency || 'INR',
    monthly_commitment: client.monthlyCommitment,
    status: client.status,
    primary_contact_name: client.primaryContactName,
    notes: client.notes || '',
    created_at: client.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('clients').insert(payload);
  if (error) throw new Error(`Failed to create client: ${error.message}`);
  return client;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.email !== undefined) payload.email = updates.email.toLowerCase().trim();
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
  if (updates.servicePackage !== undefined) payload.service_package = updates.servicePackage;
  if (updates.contractStartDate !== undefined) payload.contract_start_date = updates.contractStartDate;
  if (updates.contractEndDate !== undefined) payload.contract_end_date = updates.contractEndDate;
  if (updates.monthlyRetainer !== undefined) payload.monthly_retainer = updates.monthlyRetainer;
  if (updates.currency !== undefined) payload.currency = updates.currency;
  if (updates.monthlyCommitment !== undefined) payload.monthly_commitment = updates.monthlyCommitment;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.primaryContactName !== undefined) payload.primary_contact_name = updates.primaryContactName;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.archivedAt !== undefined) payload.archived_at = updates.archivedAt;
  if (updates.archivedByUserId !== undefined) payload.archived_by_user_id = updates.archivedByUserId;

  const { error } = await supabaseAdmin.from('clients').update(payload).eq('id', id);
  if (error) throw new Error(`Failed to update client: ${error.message}`);
  return getClientById(id);
}

export async function deleteClient(id: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('clients').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete client: ${error.message}`);
  return true;
}

// ============================================================================
// 3. EMPLOYEES REPOSITORY
// ============================================================================

export async function getEmployees(): Promise<Employee[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
  return (data || []).map((e) => ({
    id: e.id,
    userId: e.user_id,
    name: e.name,
    email: e.email,
    phone: e.phone || '',
    department: e.department,
    designation: e.designation,
    status: e.status,
    maxConcurrentTasks: e.max_concurrent_tasks,
    currentActiveTasks: e.current_active_tasks || 0,
    joinedDate: e.joined_date,
    performanceScore: e.performance_score,
    skills: Array.isArray(e.skills) ? e.skills : [],
    deactivatedAt: e.deactivated_at,
    deactivatedByUserId: e.deactivated_by_user_id,
  }));
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('employees').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch employee: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    department: data.department,
    designation: data.designation,
    status: data.status,
    maxConcurrentTasks: data.max_concurrent_tasks,
    currentActiveTasks: data.current_active_tasks || 0,
    joinedDate: data.joined_date,
    performanceScore: data.performance_score,
    skills: Array.isArray(data.skills) ? data.skills : [],
    deactivatedAt: data.deactivated_at,
    deactivatedByUserId: data.deactivated_by_user_id,
  };
}

export async function createEmployee(emp: Employee): Promise<Employee> {
  assertSupabaseReady();
  const payload = {
    id: emp.id,
    user_id: emp.userId,
    name: emp.name,
    email: emp.email.toLowerCase().trim(),
    phone: emp.phone || '',
    department: emp.department,
    designation: emp.designation,
    status: emp.status || 'active',
    max_concurrent_tasks: emp.maxConcurrentTasks,
    current_active_tasks: emp.currentActiveTasks || 0,
    joined_date: emp.joinedDate,
    performance_score: emp.performanceScore,
    skills: emp.skills,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('employees').insert(payload);
  if (error) throw new Error(`Failed to create employee: ${error.message}`);
  return emp;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email.toLowerCase().trim();
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.department !== undefined) payload.department = updates.department;
  if (updates.designation !== undefined) payload.designation = updates.designation;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.maxConcurrentTasks !== undefined) payload.max_concurrent_tasks = updates.maxConcurrentTasks;
  if (updates.currentActiveTasks !== undefined) payload.current_active_tasks = updates.currentActiveTasks;
  if (updates.performanceScore !== undefined) payload.performance_score = updates.performanceScore;
  if (updates.skills !== undefined) payload.skills = updates.skills;
  if (updates.deactivatedAt !== undefined) payload.deactivated_at = updates.deactivatedAt;
  if (updates.deactivatedByUserId !== undefined) payload.deactivated_by_user_id = updates.deactivatedByUserId;

  const { error } = await supabaseAdmin.from('employees').update(payload).eq('id', id);
  if (error) throw new Error(`Failed to update employee: ${error.message}`);
  return getEmployeeById(id);
}

export async function deleteEmployee(id: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('employees').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete employee: ${error.message}`);
  return true;
}

// ============================================================================
// 4. PROJECTS REPOSITORY
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
  return (data || []).map((p) => ({
    id: p.id,
    clientId: p.client_id,
    clientName: p.client_name || '',
    title: p.title,
    description: p.description || '',
    objective: p.objective,
    startDate: p.start_date,
    targetEndDate: p.target_end_date || p.deadline,
    priority: p.priority,
    status: p.status,
    assignedEmployees: Array.isArray(p.assigned_employees) ? p.assigned_employees : [],
    budget: Number(p.budget) || 0,
    currency: p.currency || 'INR',
    progress: p.progress || 0,
    totalDeliverablesTarget: p.total_deliverables_target || 0,
    completedDeliverablesCount: p.completed_deliverables_count || 0,
    archivedAt: p.archived_at,
    archivedByUserId: p.archived_by_user_id,
    createdAt: p.created_at,
  }));
}

export async function getProjectById(id: string): Promise<Project | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch project: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    clientId: data.client_id,
    clientName: data.client_name || '',
    title: data.title,
    description: data.description || '',
    objective: data.objective,
    startDate: data.start_date,
    targetEndDate: data.target_end_date || data.deadline,
    priority: data.priority,
    status: data.status,
    assignedEmployees: Array.isArray(data.assigned_employees) ? data.assigned_employees : [],
    budget: Number(data.budget) || 0,
    currency: data.currency || 'INR',
    progress: data.progress || 0,
    totalDeliverablesTarget: data.total_deliverables_target || 0,
    completedDeliverablesCount: data.completed_deliverables_count || 0,
    archivedAt: data.archived_at,
    archivedByUserId: data.archived_by_user_id,
    createdAt: data.created_at,
  };
}

export async function createProject(p: Project): Promise<Project> {
  assertSupabaseReady();
  const payload = {
    id: p.id,
    client_id: p.clientId,
    client_name: p.clientName,
    title: p.title,
    description: p.description || '',
    objective: p.objective || '',
    start_date: p.startDate,
    target_end_date: p.targetEndDate,
    deadline: p.targetEndDate,
    priority: p.priority || 'medium',
    status: p.status || 'planning',
    assigned_employees: p.assignedEmployees || [],
    budget: p.budget || 0,
    currency: p.currency || 'INR',
    total_deliverables_target: p.totalDeliverablesTarget || 0,
    completed_deliverables_count: p.completedDeliverablesCount || 0,
    created_at: p.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('projects').insert(payload);
  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return p;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.objective !== undefined) payload.objective = updates.objective;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.progress !== undefined) payload.progress = updates.progress;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.targetEndDate !== undefined) {
    payload.target_end_date = updates.targetEndDate;
    payload.deadline = updates.targetEndDate;
  }
  if (updates.assignedEmployees !== undefined) payload.assigned_employees = updates.assignedEmployees;
  if (updates.completedDeliverablesCount !== undefined) payload.completed_deliverables_count = updates.completedDeliverablesCount;
  if (updates.totalDeliverablesTarget !== undefined) payload.total_deliverables_target = updates.totalDeliverablesTarget;
  if (updates.archivedAt !== undefined) payload.archived_at = updates.archivedAt;
  if (updates.archivedByUserId !== undefined) payload.archived_by_user_id = updates.archivedByUserId;

  const { error } = await supabaseAdmin.from('projects').update(payload).eq('id', id);
  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return getProjectById(id);
}

export async function deleteProject(id: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete project: ${error.message}`);
  return true;
}

// ============================================================================
// 5. TASKS REPOSITORY
// ============================================================================

export async function getTasks(): Promise<Task[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return (data || []).map((t) => ({
    id: t.id,
    title: t.title,
    clientId: t.client_id,
    clientName: t.client_name || '',
    projectId: t.project_id,
    projectTitle: t.project_title || '',
    deliverableId: t.deliverable_id,
    description: t.description || '',
    assignedEmployeeId: t.assigned_employee_id,
    assignedEmployeeName: t.assigned_employee_name || '',
    assignedEmployeeDepartment: t.assigned_employee_department || 'Video Editing',
    assignedEmployeeIds: Array.isArray(t.assigned_employee_ids) ? t.assigned_employee_ids : [],
    priority: t.priority,
    startDate: t.start_date,
    deadline: t.deadline,
    estimatedHours: Number(t.estimated_hours) || 4,
    status: t.status,
    referenceFiles: Array.isArray(t.reference_files) ? t.reference_files : [],
    requiredOutput: t.required_output || '',
    submissions: Array.isArray(t.submissions) ? t.submissions : [],
    comments: Array.isArray(t.comments) ? t.comments : [],
    feedbackNotes: t.feedback_notes,
    completedAt: t.completed_at,
    cancelledAt: t.cancelled_at,
    cancelledByUserId: t.cancelled_by_user_id,
    createdAt: t.created_at,
  }));
}

export async function getTaskById(id: string): Promise<Task | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('tasks').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch task: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    clientId: data.client_id,
    clientName: data.client_name || '',
    projectId: data.project_id,
    projectTitle: data.project_title || '',
    deliverableId: data.deliverable_id,
    description: data.description || '',
    assignedEmployeeId: data.assigned_employee_id,
    assignedEmployeeName: data.assigned_employee_name || '',
    assignedEmployeeDepartment: data.assigned_employee_department || 'Video Editing',
    assignedEmployeeIds: Array.isArray(data.assigned_employee_ids) ? data.assigned_employee_ids : [],
    priority: data.priority,
    startDate: data.start_date,
    deadline: data.deadline,
    estimatedHours: Number(data.estimated_hours) || 4,
    status: data.status,
    referenceFiles: Array.isArray(data.reference_files) ? data.reference_files : [],
    requiredOutput: data.required_output || '',
    submissions: Array.isArray(data.submissions) ? data.submissions : [],
    comments: Array.isArray(data.comments) ? data.comments : [],
    feedbackNotes: data.feedback_notes,
    completedAt: data.completed_at,
    cancelledAt: data.cancelled_at,
    cancelledByUserId: data.cancelled_by_user_id,
    createdAt: data.created_at,
  };
}

export async function createTask(task: Task): Promise<Task> {
  assertSupabaseReady();
  const payload = {
    id: task.id,
    title: task.title,
    client_id: task.clientId,
    client_name: task.clientName,
    project_id: task.projectId,
    project_title: task.projectTitle,
    deliverable_id: task.deliverableId,
    description: task.description || '',
    assigned_employee_id: task.assignedEmployeeId,
    assigned_employee_name: task.assignedEmployeeName,
    assigned_employee_department: task.assignedEmployeeDepartment,
    assigned_employee_ids: task.assignedEmployeeIds || [],
    priority: task.priority || 'medium',
    status: task.status || 'backlog',
    start_date: task.startDate || new Date().toISOString().split('T')[0],
    deadline: task.deadline,
    estimated_hours: task.estimatedHours || 4,
    reference_files: task.referenceFiles || [],
    required_output: task.requiredOutput || '',
    submissions: task.submissions || [],
    comments: task.comments || [],
    feedback_notes: task.feedbackNotes,
    created_at: task.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('tasks').insert(payload);
  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.deadline !== undefined) payload.deadline = updates.deadline;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.assignedEmployeeId !== undefined) payload.assigned_employee_id = updates.assignedEmployeeId;
  if (updates.assignedEmployeeName !== undefined) payload.assigned_employee_name = updates.assignedEmployeeName;
  if (updates.assignedEmployeeDepartment !== undefined) payload.assigned_employee_department = updates.assignedEmployeeDepartment;
  if (updates.assignedEmployeeIds !== undefined) payload.assigned_employee_ids = updates.assignedEmployeeIds;
  if (updates.submissions !== undefined) payload.submissions = updates.submissions;
  if (updates.comments !== undefined) payload.comments = updates.comments;
  if (updates.feedbackNotes !== undefined) payload.feedback_notes = updates.feedbackNotes;
  if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;
  if (updates.cancelledAt !== undefined) payload.cancelled_at = updates.cancelledAt;
  if (updates.cancelledByUserId !== undefined) payload.cancelled_by_user_id = updates.cancelledByUserId;

  const { error } = await supabaseAdmin.from('tasks').update(payload).eq('id', id);
  if (error) throw new Error(`Failed to update task: ${error.message}`);
  return getTaskById(id);
}

export async function deleteTask(id: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete task: ${error.message}`);
  return true;
}

// ============================================================================
// 6. DELIVERABLES REPOSITORY
// ============================================================================

export async function getDeliverables(): Promise<Deliverable[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('deliverables')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch deliverables: ${error.message}`);
  return (data || []).map((d) => ({
    id: d.id,
    title: d.title,
    clientId: d.client_id,
    clientName: d.client_name || '',
    projectId: d.project_id,
    projectTitle: d.project_title || '',
    type: d.type,
    targetMonth: d.target_month || '2026-11',
    status: d.status,
    stage: d.stage,
    assignedEmployeeId: d.assigned_employee_id,
    assignedEmployeeName: d.assigned_employee_name || '',
    deadline: d.deadline,
    scheduledPublishDate: d.scheduled_publish_date,
    mediaUrl: d.media_url,
    thumbnailUrl: d.thumbnail_url,
    scriptText: d.script_text,
    scriptApproved: Boolean(d.script_approved),
    scriptApprovedAt: d.script_approved_at,
    videoApproved: Boolean(d.video_approved),
    videoApprovedAt: d.video_approved_at,
    currentVersion: d.current_version || 1,
    versions: Array.isArray(d.versions) ? d.versions : [],
    isCountedTowardsCommitment: Boolean(d.is_counted_towards_commitment),
    publishedAt: d.published_at,
    cancelledAt: d.cancelled_at,
    cancellationReason: d.cancellation_reason,
    createdAt: d.created_at,
  }));
}

export async function getDeliverableById(id: string): Promise<Deliverable | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('deliverables').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to fetch deliverable: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    clientId: data.client_id,
    clientName: data.client_name || '',
    projectId: data.project_id,
    projectTitle: data.project_title || '',
    type: data.type,
    targetMonth: data.target_month || '2026-11',
    status: data.status,
    stage: data.stage,
    assignedEmployeeId: data.assigned_employee_id,
    assignedEmployeeName: data.assigned_employee_name || '',
    deadline: data.deadline,
    scheduledPublishDate: data.scheduled_publish_date,
    mediaUrl: data.media_url,
    thumbnailUrl: data.thumbnail_url,
    scriptText: data.script_text,
    scriptApproved: Boolean(data.script_approved),
    scriptApprovedAt: data.script_approved_at,
    videoApproved: Boolean(data.video_approved),
    videoApprovedAt: data.video_approved_at,
    currentVersion: data.current_version || 1,
    versions: Array.isArray(data.versions) ? data.versions : [],
    isCountedTowardsCommitment: Boolean(data.is_counted_towards_commitment),
    publishedAt: data.published_at,
    cancelledAt: data.cancelled_at,
    cancellationReason: data.cancellation_reason,
    createdAt: data.created_at,
  };
}

export async function createDeliverable(d: Deliverable): Promise<Deliverable> {
  assertSupabaseReady();
  const payload = {
    id: d.id,
    title: d.title,
    client_id: d.clientId,
    client_name: d.clientName,
    project_id: d.projectId,
    project_title: d.projectTitle,
    type: d.type,
    target_month: d.targetMonth || '2026-11',
    status: d.status || 'in_progress',
    stage: d.stage || 'content_planning',
    assigned_employee_id: d.assignedEmployeeId,
    assigned_employee_name: d.assignedEmployeeName,
    deadline: d.deadline,
    scheduled_publish_date: d.scheduledPublishDate,
    media_url: d.mediaUrl,
    thumbnail_url: d.thumbnailUrl,
    script_text: d.scriptText,
    script_approved: Boolean(d.scriptApproved),
    script_approved_at: d.scriptApprovedAt,
    video_approved: Boolean(d.videoApproved),
    video_approved_at: d.videoApprovedAt,
    current_version: d.currentVersion || 1,
    versions: d.versions || [],
    is_counted_towards_commitment: Boolean(d.isCountedTowardsCommitment),
    published_at: d.publishedAt,
    cancelled_at: d.cancelledAt,
    cancellation_reason: d.cancellationReason,
    created_at: d.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('deliverables').insert(payload);
  if (error) throw new Error(`Failed to create deliverable: ${error.message}`);
  return d;
}

export async function updateDeliverable(id: string, updates: Partial<Deliverable>): Promise<Deliverable | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.stage !== undefined) payload.stage = updates.stage;
  if (updates.currentVersion !== undefined) payload.current_version = updates.currentVersion;
  if (updates.versions !== undefined) payload.versions = updates.versions;
  if (updates.scriptText !== undefined) payload.script_text = updates.scriptText;
  if (updates.scriptApproved !== undefined) payload.script_approved = updates.scriptApproved;
  if (updates.scriptApprovedAt !== undefined) payload.script_approved_at = updates.scriptApprovedAt;
  if (updates.videoApproved !== undefined) payload.video_approved = updates.videoApproved;
  if (updates.videoApprovedAt !== undefined) payload.video_approved_at = updates.videoApprovedAt;
  if (updates.mediaUrl !== undefined) payload.media_url = updates.mediaUrl;
  if (updates.thumbnailUrl !== undefined) payload.thumbnail_url = updates.thumbnailUrl;
  if (updates.scheduledPublishDate !== undefined) payload.scheduled_publish_date = updates.scheduledPublishDate;
  if (updates.deadline !== undefined) payload.deadline = updates.deadline;
  if (updates.assignedEmployeeId !== undefined) payload.assigned_employee_id = updates.assignedEmployeeId;
  if (updates.assignedEmployeeName !== undefined) payload.assigned_employee_name = updates.assignedEmployeeName;
  if (updates.isCountedTowardsCommitment !== undefined) payload.is_counted_towards_commitment = updates.isCountedTowardsCommitment;
  if (updates.publishedAt !== undefined) payload.published_at = updates.publishedAt;
  if (updates.cancelledAt !== undefined) payload.cancelled_at = updates.cancelledAt;
  if (updates.cancellationReason !== undefined) payload.cancellation_reason = updates.cancellationReason;

  const { error } = await supabaseAdmin.from('deliverables').update(payload).eq('id', id);
  if (error) throw new Error(`Failed to update deliverable: ${error.message}`);
  return getDeliverableById(id);
}

export async function deleteDeliverable(id: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('deliverables').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete deliverable: ${error.message}`);
  return true;
}

// ============================================================================
// 7. CLIENT APPROVALS REPOSITORY
// ============================================================================

export async function getClientApprovals(): Promise<ClientApprovalRecord[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('client_approvals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch approvals: ${error.message}`);
  return (data || []).map((a) => ({
    id: a.id,
    clientId: a.client_id,
    clientName: a.client_name || '',
    deliverableId: a.deliverable_id,
    deliverableTitle: a.deliverable_title || '',
    type: a.type,
    version: a.version || 1,
    status: a.status,
    action: a.action,
    feedback: a.feedback || a.client_notes || '',
    categories: Array.isArray(a.categories) ? a.categories : [],
    decisionDate: a.decision_date || a.decided_at || a.created_at,
    decidedByUserId: a.decided_by_user_id || '',
    decidedByUserName: a.decided_by_user_name || a.signed_off_by || '',
    recordedByAdminOrManager: Boolean(a.recorded_by_admin_or_manager),
  }));
}

export async function createClientApproval(a: ClientApprovalRecord): Promise<ClientApprovalRecord> {
  assertSupabaseReady();
  const payload = {
    id: a.id,
    deliverable_id: a.deliverableId,
    deliverable_title: a.deliverableTitle,
    client_id: a.clientId,
    client_name: a.clientName,
    type: a.type,
    version: a.version,
    status: a.status,
    action: a.action,
    feedback: a.feedback,
    client_notes: a.feedback,
    categories: a.categories || [],
    signed_off_by: a.decidedByUserName,
    decision_date: a.decisionDate || new Date().toISOString(),
    decided_at: a.decisionDate || new Date().toISOString(),
    decided_by_user_id: a.decidedByUserId,
    decided_by_user_name: a.decidedByUserName,
    recorded_by_admin_or_manager: Boolean(a.recordedByAdminOrManager),
    created_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('client_approvals').insert(payload);
  if (error) throw new Error(`Failed to create approval record: ${error.message}`);
  return a;
}

// ============================================================================
// 8. SESSIONS REPOSITORY (Supabase Auth / Session Tokens)
// ============================================================================

export async function getSessionByToken(token: string): Promise<UserSession | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('sessions').select('*').eq('token', token).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    token: data.token,
    userId: data.user_id,
    role: data.role,
    permissionGroup: data.permission_group,
    clientId: data.client_id,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
  };
}

export async function createSessionRecord(session: UserSession): Promise<UserSession> {
  assertSupabaseReady();
  const payload = {
    id: session.id,
    token: session.token,
    user_id: session.userId,
    role: session.role,
    permission_group: session.permissionGroup,
    client_id: session.clientId,
    created_at: session.createdAt || new Date().toISOString(),
    expires_at: session.expiresAt,
  };

  const { error } = await supabaseAdmin.from('sessions').insert(payload);
  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return session;
}

export async function deleteSessionRecord(token: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('sessions').delete().eq('token', token);
  return !error;
}

export async function deleteExpiredSessions(): Promise<void> {
  assertSupabaseReady();
  await supabaseAdmin.from('sessions').delete().lt('expires_at', new Date().toISOString());
}

// ============================================================================
// 9. NOTIFICATIONS REPOSITORY
// ============================================================================

export async function getNotifications(userId?: string, role?: string): Promise<NotificationItem[]> {
  assertSupabaseReady();
  let query = supabaseAdmin.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);

  if (userId) {
    query = query.or(`recipient_user_id.eq.${userId},target_role.eq.all_admin,user_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
  return (data || []).map((n) => ({
    id: n.id,
    targetRole: n.target_role || 'all_admin',
    recipientUserId: n.recipient_user_id || n.user_id,
    recipientClientId: n.recipient_client_id,
    title: n.title,
    message: n.message,
    type: n.type,
    relatedId: n.related_id || n.deliverable_id || n.task_id,
    read: Boolean(n.read),
    createdAt: n.created_at,
  }));
}

export async function createNotification(n: NotificationItem): Promise<NotificationItem> {
  assertSupabaseReady();
  const payload = {
    id: n.id,
    target_role: n.targetRole,
    recipient_user_id: n.recipientUserId,
    recipient_client_id: n.recipientClientId,
    title: n.title,
    message: n.message,
    type: n.type,
    related_id: n.relatedId,
    read: Boolean(n.read),
    created_at: n.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('notifications').insert(payload);
  if (error) throw new Error(`Failed to create notification: ${error.message}`);
  return n;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.from('notifications').update({ read: true }).eq('id', id);
  return !error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  assertSupabaseReady();
  await supabaseAdmin
    .from('notifications')
    .update({ read: true })
    .or(`recipient_user_id.eq.${userId},target_role.eq.all_admin`);
}

// ============================================================================
// 10. INVITATIONS REPOSITORY
// ============================================================================

export async function getInvitations(): Promise<Invitation[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch invitations: ${error.message}`);
  return (data || []).map((i) => ({
    id: i.id,
    email: i.email,
    fullName: i.full_name,
    username: i.username,
    role: i.role,
    department: i.department,
    clientId: i.client_id,
    clientName: i.client_name,
    token: i.token,
    status: i.status,
    expiresAt: i.expires_at,
    acceptedAt: i.accepted_at,
    createdAt: i.created_at,
  }));
}

export async function getInvitationById(id: string): Promise<Invitation | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('invitations').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    username: data.username,
    role: data.role,
    department: data.department,
    clientId: data.client_id,
    clientName: data.client_name,
    token: data.token,
    status: data.status,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
    createdAt: data.created_at,
  };
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('invitations').select('*').eq('token', token).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    username: data.username,
    role: data.role,
    department: data.department,
    clientId: data.client_id,
    clientName: data.client_name,
    token: data.token,
    status: data.status,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
    createdAt: data.created_at,
  };
}

export async function createInvitation(inv: Invitation): Promise<Invitation> {
  assertSupabaseReady();
  const payload = {
    id: inv.id,
    email: inv.email.toLowerCase().trim(),
    full_name: inv.fullName,
    username: inv.username.toLowerCase().trim(),
    role: inv.role,
    department: inv.department,
    client_id: inv.clientId,
    client_name: inv.clientName,
    token: inv.token,
    status: inv.status || 'pending',
    expires_at: inv.expiresAt,
    created_at: inv.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('invitations').insert(payload);
  if (error) throw new Error(`Failed to create invitation: ${error.message}`);
  return inv;
}

export async function updateInvitation(id: string, updates: Partial<Invitation>): Promise<Invitation | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.acceptedAt !== undefined) payload.accepted_at = updates.acceptedAt;

  const { error } = await supabaseAdmin.from('invitations').update(payload).eq('id', id);
  if (error) throw new Error(`Failed to update invitation: ${error.message}`);
  return getInvitationByToken(id);
}

// ============================================================================
// 11. AUDIT LOGS REPOSITORY
// ============================================================================

export async function getAuditLogs(limit: number = 200): Promise<AuditLog[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);
  return (data || []).map((l) => ({
    id: l.id,
    userId: l.user_id,
    userName: l.user_name,
    userRole: l.user_role,
    action: l.action,
    details: l.details,
    targetType: l.target_type,
    targetId: l.target_id,
    timestamp: l.timestamp,
  }));
}

export async function createAuditLog(log: AuditLog): Promise<AuditLog> {
  assertSupabaseReady();
  const payload = {
    id: log.id,
    user_id: log.userId,
    user_name: log.userName,
    user_role: log.userRole,
    action: log.action,
    details: log.details,
    target_type: log.targetType,
    target_id: log.targetId || '',
    timestamp: log.timestamp || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('audit_logs').insert(payload);
  if (error) throw new Error(`Failed to insert audit log: ${error.message}`);
  return log;
}

// ============================================================================
// 12. FINANCE REPOSITORY (Invoices, Payments, Expenses)
// ============================================================================

export async function getInvoices(): Promise<Invoice[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
  return (data || []).map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    clientId: inv.client_id,
    clientName: inv.client_name || '',
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    amount: Number(inv.amount) || 0,
    currency: inv.currency || 'INR',
    status: inv.status,
    paidAmount: Number(inv.paid_amount) || 0,
    items: Array.isArray(inv.items) ? inv.items : [],
    notes: inv.notes,
    createdAt: inv.created_at,
  }));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin.from('invoices').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    clientId: data.client_id,
    clientName: data.client_name || '',
    issueDate: data.issue_date,
    dueDate: data.due_date,
    amount: Number(data.amount) || 0,
    currency: data.currency || 'INR',
    status: data.status,
    paidAmount: Number(data.paid_amount) || 0,
    items: Array.isArray(data.items) ? data.items : [],
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function createInvoice(inv: Invoice): Promise<Invoice> {
  assertSupabaseReady();
  const payload = {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    client_id: inv.clientId,
    client_name: inv.clientName,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status,
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
    paid_amount: inv.paidAmount || 0,
    items: inv.items || [],
    notes: inv.notes || '',
    created_at: inv.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('invoices').insert(payload);
  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return inv;
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  assertSupabaseReady();
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.paidAmount !== undefined) payload.paid_amount = updates.paidAmount;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { error } = await supabaseAdmin.from('invoices').update(payload).eq('id', id);
  if (error) throw new Error(`Failed to update invoice: ${error.message}`);
  const { data } = await supabaseAdmin.from('invoices').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    clientId: data.client_id,
    clientName: data.client_name || '',
    issueDate: data.issue_date,
    dueDate: data.due_date,
    amount: Number(data.amount) || 0,
    currency: data.currency || 'INR',
    status: data.status,
    paidAmount: Number(data.paid_amount) || 0,
    items: Array.isArray(data.items) ? data.items : [],
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function getPayments(): Promise<PaymentRecord[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
  return (data || []).map((p) => ({
    id: p.id,
    invoiceId: p.invoice_id,
    clientId: p.client_id,
    clientName: p.client_name || '',
    amount: Number(p.amount) || 0,
    currency: p.currency || 'INR',
    paymentDate: p.payment_date,
    paymentMethod: p.payment_method,
    transactionReference: p.transaction_reference,
    notes: p.notes,
    createdAt: p.created_at,
  }));
}

export async function createPayment(p: PaymentRecord): Promise<PaymentRecord> {
  assertSupabaseReady();
  const payload = {
    id: p.id,
    invoice_id: p.invoiceId,
    client_id: p.clientId,
    client_name: p.clientName,
    amount: p.amount,
    currency: p.currency,
    payment_date: p.paymentDate,
    payment_method: p.paymentMethod,
    transaction_reference: p.transactionReference,
    notes: p.notes || '',
    created_at: p.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('payments').insert(payload);
  if (error) throw new Error(`Failed to create payment: ${error.message}`);
  return p;
}

export async function getExpenses(): Promise<ExpenseRecord[]> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`);
  return (data || []).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    amount: Number(e.amount) || 0,
    currency: e.currency || 'INR',
    date: e.date,
    vendor: e.vendor,
    recordedByUserId: e.recorded_by_user_id || '',
    notes: e.notes,
    createdAt: e.created_at,
  }));
}

export async function createExpense(e: ExpenseRecord): Promise<ExpenseRecord> {
  assertSupabaseReady();
  const payload = {
    id: e.id,
    title: e.title,
    category: e.category,
    amount: e.amount,
    currency: e.currency,
    date: e.date,
    vendor: e.vendor,
    recorded_by_user_id: e.recordedByUserId,
    notes: e.notes || '',
    created_at: e.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('expenses').insert(payload);
  if (error) throw new Error(`Failed to create expense: ${error.message}`);
  return e;
}

// ============================================================================
// 13. PASSWORD RESETS REPOSITORY
// ============================================================================

export async function getPasswordResetByToken(token: string): Promise<PasswordResetToken | null> {
  assertSupabaseReady();
  const { data, error } = await supabaseAdmin
    .from('password_resets')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    token: data.token,
    expiresAt: data.expires_at,
    used: Boolean(data.used),
    createdAt: data.created_at,
  };
}

export async function createPasswordReset(record: PasswordResetToken): Promise<PasswordResetToken> {
  assertSupabaseReady();
  const payload = {
    id: record.id,
    user_id: record.userId,
    email: record.email,
    token: record.token,
    expires_at: record.expiresAt,
    used: false,
    created_at: record.createdAt || new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('password_resets').insert(payload);
  if (error) throw new Error(`Failed to create password reset: ${error.message}`);
  return record;
}

export async function markPasswordResetUsed(id: string): Promise<void> {
  assertSupabaseReady();
  await supabaseAdmin.from('password_resets').update({ used: true }).eq('id', id);
}

// ============================================================================
// MASTER STATE AGGREGATOR (Queries all Supabase tables concurrently)
// ============================================================================

export async function getFullAppState(): Promise<AppState> {
  assertSupabaseReady();
  const [
    users,
    clients,
    employees,
    projects,
    tasks,
    deliverables,
    approvals,
    notifications,
    invitations,
    auditLogs,
    invoices,
    payments,
    expenses,
  ] = await Promise.all([
    getUsers().catch(() => []),
    getClients().catch(() => []),
    getEmployees().catch(() => []),
    getProjects().catch(() => []),
    getTasks().catch(() => []),
    getDeliverables().catch(() => []),
    getClientApprovals().catch(() => []),
    getNotifications().catch(() => []),
    getInvitations().catch(() => []),
    getAuditLogs().catch(() => []),
    getInvoices().catch(() => []),
    getPayments().catch(() => []),
    getExpenses().catch(() => []),
  ]);

  return {
    users,
    clients,
    employees,
    projects,
    tasks,
    deliverables,
    approvals,
    notifications,
    invitations,
    auditLogs,
    invoices,
    payments,
    expenses,
  };
}
