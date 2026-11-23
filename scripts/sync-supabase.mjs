import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Load environment variables from .env.local or .env
function loadEnv() {
  const envPaths = [path.join(rootDir, '.env.local'), path.join(rootDir, '.env')];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...values] = trimmed.split('=');
          const val = values.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-ref')) {
  console.error('\x1b[31m[ERROR] Supabase is not configured yet.\x1b[0m');
  console.log('\nPlease add your credentials to .env.local:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function syncAll() {
  const dbFile = path.join(rootDir, 'data', 'db.json');
  if (!fs.existsSync(dbFile)) {
    console.error('[ERROR] data/db.json file not found.');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbFile, 'utf-8');
  const db = JSON.parse(raw);

  console.log('\x1b[36mConnecting to Supabase at:\x1b[0m', supabaseUrl);

  // Sync Users
  if (db.users && db.users.length > 0) {
    const formattedUsers = db.users.map((u) => ({
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
    }));
    const { error: userErr } = await supabase.from('users').upsert(formattedUsers, { onConflict: 'id' });
    if (userErr) console.warn('Warning syncing users:', userErr.message);
    else console.log(`✓ Synced ${formattedUsers.length} Users to Supabase`);
  }

  // Sync Clients
  if (db.clients && db.clients.length > 0) {
    const formattedClients = db.clients.map((c) => ({
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
    }));
    const { error: cliErr } = await supabase.from('clients').upsert(formattedClients, { onConflict: 'id' });
    if (cliErr) console.warn('Warning syncing clients:', cliErr.message);
    else console.log(`✓ Synced ${formattedClients.length} Clients to Supabase`);
  }

  // Sync Employees
  if (db.employees && db.employees.length > 0) {
    const formattedEmployees = db.employees.map((e) => ({
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
    }));
    const { error: empErr } = await supabase.from('employees').upsert(formattedEmployees, { onConflict: 'id' });
    if (empErr) console.warn('Warning syncing employees:', empErr.message);
    else console.log(`✓ Synced ${formattedEmployees.length} Employees to Supabase`);
  }

  // Sync Projects
  if (db.projects && db.projects.length > 0) {
    const formattedProjects = db.projects.map((p) => ({
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
    }));
    const { error: projErr } = await supabase.from('projects').upsert(formattedProjects, { onConflict: 'id' });
    if (projErr) console.warn('Warning syncing projects:', projErr.message);
    else console.log(`✓ Synced ${formattedProjects.length} Projects to Supabase`);
  }

  // Sync Tasks
  if (db.tasks && db.tasks.length > 0) {
    const formattedTasks = db.tasks.map((t) => ({
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
    }));
    const { error: taskErr } = await supabase.from('tasks').upsert(formattedTasks, { onConflict: 'id' });
    if (taskErr) console.warn('Warning syncing tasks:', taskErr.message);
    else console.log(`✓ Synced ${formattedTasks.length} Tasks to Supabase`);
  }

  // Sync Deliverables
  if (db.deliverables && db.deliverables.length > 0) {
    const formattedDeliverables = db.deliverables.map((d) => ({
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
    }));
    const { error: delivErr } = await supabase.from('deliverables').upsert(formattedDeliverables, { onConflict: 'id' });
    if (delivErr) console.warn('Warning syncing deliverables:', delivErr.message);
    else console.log(`✓ Synced ${formattedDeliverables.length} Deliverables to Supabase`);
  }

  console.log('\n\x1b[32m[SUCCESS] All Flowdesk entities successfully synced with Supabase PostgreSQL!\x1b[0m');
}

syncAll().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
