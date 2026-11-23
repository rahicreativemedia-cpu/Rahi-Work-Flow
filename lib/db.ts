import fs from 'fs';
import path from 'path';
import { AppState } from './types';
import { initialData } from '../data/seedData';
import { isSupabaseConfigured, supabaseAdmin } from './supabase';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

/**
 * Background synchronization to Supabase PostgreSQL when credentials are set.
 */
async function syncToSupabaseAsync(state: AppState) {
  if (!isSupabaseConfigured()) return;

  try {
    // 1. Sync Users
    if (state.users && state.users.length > 0) {
      await supabaseAdmin.from('users').upsert(
        state.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          username: u.username || u.email.split('@')[0],
          role: u.role,
          permission_group: u.permissionGroup,
          department: u.department,
          client_id: u.clientId,
          client_name: u.clientName,
          employee_id: u.employeeId,
          avatar: u.avatar,
          status: u.status || 'active',
          phone: u.phone,
          password_hash: u.passwordHash,
          created_at: u.createdAt || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }

    // 2. Sync Clients
    if (state.clients && state.clients.length > 0) {
      await supabaseAdmin.from('clients').upsert(
        state.clients.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company || c.name,
          email: c.email,
          phone: c.phone,
          logo_url: c.logoUrl,
          service_package: c.servicePackage,
          contract_start_date: c.contractStartDate || new Date().toISOString().split('T')[0],
          contract_end_date: c.contractEndDate || '2027-11-22',
          monthly_retainer: c.monthlyRetainer || 150000,
          currency: c.currency || 'INR',
          monthly_commitment: c.monthlyCommitment || {},
          status: c.status || 'active',
          primary_contact_name: c.primaryContactName,
          notes: c.notes,
          created_at: c.createdAt || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }

    // 3. Sync Employees
    if (state.employees && state.employees.length > 0) {
      await supabaseAdmin.from('employees').upsert(
        state.employees.map((e) => ({
          id: e.id,
          user_id: e.userId,
          name: e.name,
          email: e.email,
          phone: e.phone,
          department: e.department,
          designation: e.designation,
          status: e.status || 'active',
          max_concurrent_tasks: e.maxConcurrentTasks || 5,
          current_active_tasks: e.currentActiveTasks || 0,
          joined_date: e.joinedDate || new Date().toISOString().split('T')[0],
          performance_score: e.performanceScore || 95,
          skills: e.skills || [],
          created_at: e.joinedDate || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }

    // 4. Sync Projects
    if (state.projects && state.projects.length > 0) {
      await supabaseAdmin.from('projects').upsert(
        state.projects.map((p) => ({
          id: p.id,
          title: p.title,
          client_id: p.clientId,
          status: p.status || 'planning',
          progress: p.progress || 0,
          priority: p.priority || 'medium',
          deadline: p.targetEndDate,
          description: p.description,
          assigned_employees: p.assignedEmployees || [],
          created_at: p.createdAt || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }

    // 5. Sync Tasks
    if (state.tasks && state.tasks.length > 0) {
      await supabaseAdmin.from('tasks').upsert(
        state.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          project_id: t.projectId,
          client_id: t.clientId,
          assigned_employee_id: t.assignedEmployeeId,
          status: t.status || 'backlog',
          priority: t.priority || 'medium',
          deadline: t.deadline,
          description: t.description,
          feedback_notes: t.feedbackNotes,
          comments: t.comments || [],
          submissions: t.submissions || [],
          created_at: t.createdAt || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }

    // 6. Sync Deliverables
    if (state.deliverables && state.deliverables.length > 0) {
      await supabaseAdmin.from('deliverables').upsert(
        state.deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          client_id: d.clientId,
          project_id: d.projectId,
          type: d.type || 'reel',
          status: d.status || 'in_progress',
          stage: d.stage || 'content_planning',
          assigned_employee_id: d.assignedEmployeeId,
          deadline: d.deadline,
          scheduled_publish_date: d.scheduledPublishDate,
          media_url: d.mediaUrl,
          current_version: d.currentVersion || 1,
          versions: d.versions || [],
          created_at: d.createdAt || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }
  } catch (err) {
    // Non-blocking log
    console.warn('[Supabase Sync Warning]', err);
  }
}

// Ensure database file exists
export function getDB(): AppState {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as AppState;
    parsed.invoices = parsed.invoices || [];
    parsed.payments = parsed.payments || [];
    parsed.expenses = parsed.expenses || [];
    parsed.sessions = parsed.sessions || [];
    parsed.passwordResets = parsed.passwordResets || [];
    (parsed as any).rateLimits = Array.isArray((parsed as any).rateLimits) ? (parsed as any).rateLimits : [];
    return parsed;
  } catch (error) {
    console.error('Failed to read database, falling back to seed:', error);
    return initialData;
  }
}

export function saveDB(state: AppState): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Sync to Supabase PostgreSQL in background if credentials are configured
    if (isSupabaseConfigured()) {
      syncToSupabaseAsync(state).catch(() => {});
    }
  } catch (error) {
    console.error('Failed to persist database:', error);
    throw error;
  }
}

export function resetDB(): AppState {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}
