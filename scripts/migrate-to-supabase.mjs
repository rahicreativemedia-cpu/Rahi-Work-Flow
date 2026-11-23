import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Load environment variables
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31m[ERROR] SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set.\x1b[0m');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runMigration() {
  console.log('\n===========================================================');
  console.log('   RAHI FLOWDESK — SUPABASE PRODUCTION DATA MIGRATION     ');
  console.log('===========================================================');
  console.log(`Target Supabase URL: ${supabaseUrl}\n`);

  const dbFile = path.join(rootDir, 'data', 'db.json');
  if (!fs.existsSync(dbFile)) {
    console.error(`[ERROR] File not found: ${dbFile}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbFile, 'utf-8');
  const db = JSON.parse(raw);

  // 1. Migrate Users
  if (db.users && db.users.length > 0) {
    console.log(`Migrating ${db.users.length} users...`);
    const usersPayload = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email.toLowerCase().trim(),
      username: (u.username || u.email.split('@')[0]).toLowerCase().trim(),
      role: u.role,
      permission_group: u.permissionGroup,
      department: u.department,
      client_id: u.clientId,
      client_name: u.clientName,
      employee_id: u.employeeId,
      avatar: u.avatar,
      status: u.status || 'active',
      phone: u.phone || '',
      password_hash: u.passwordHash,
      created_at: u.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('users').upsert(usersPayload, { onConflict: 'id' });
    if (error) {
      console.error('❌ Failed to migrate users:', error.message);
    } else {
      console.log(`✅ ${usersPayload.length} users successfully migrated.`);
    }
  }

  // 2. Migrate Clients
  if (db.clients && db.clients.length > 0) {
    console.log(`Migrating ${db.clients.length} clients...`);
    const clientsPayload = db.clients.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company || c.name,
      email: c.email.toLowerCase().trim(),
      phone: c.phone || '',
      logo_url: c.logoUrl || '',
      service_package: c.servicePackage,
      contract_start_date: c.contractStartDate || new Date().toISOString().split('T')[0],
      contract_end_date: c.contractEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthly_retainer: c.monthlyRetainer || 150000,
      currency: c.currency || 'INR',
      monthly_commitment: c.monthlyCommitment || {},
      status: c.status || 'active',
      primary_contact_name: c.primaryContactName || c.name,
      notes: c.notes || '',
      created_at: c.createdAt || new Date().toISOString(),
      archived_at: c.archivedAt,
      archived_by_user_id: c.archivedByUserId,
    }));

    const { error } = await supabase.from('clients').upsert(clientsPayload, { onConflict: 'id' });
    if (error) {
      console.error('❌ Failed to migrate clients:', error.message);
    } else {
      console.log(`✅ ${clientsPayload.length} clients successfully migrated.`);
    }
  }

  // 3. Migrate Employees
  if (db.employees && db.employees.length > 0) {
    console.log(`Migrating ${db.employees.length} employees...`);
    const employeesPayload = db.employees.map((e) => ({
      id: e.id,
      user_id: e.userId,
      name: e.name,
      email: e.email.toLowerCase().trim(),
      phone: e.phone || '',
      department: e.department || 'Video Editing',
      designation: e.designation || 'Creative Specialist',
      status: e.status || 'active',
      max_concurrent_tasks: e.maxConcurrentTasks || 5,
      current_active_tasks: e.currentActiveTasks || 0,
      joined_date: e.joinedDate || new Date().toISOString().split('T')[0],
      performance_score: e.performanceScore || 95,
      skills: e.skills || ['Creative Production'],
      created_at: e.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabase.from('employees').upsert(employeesPayload, { onConflict: 'id' });
    if (error) {
      console.error('❌ Failed to migrate employees:', error.message);
    } else {
      console.log(`✅ ${employeesPayload.length} employees successfully migrated.`);
    }
  }

  // 4. Migrate Audit Logs
  if (db.auditLogs && db.auditLogs.length > 0) {
    console.log(`Migrating ${db.auditLogs.length} audit logs...`);
    const logsPayload = db.auditLogs.map((l) => ({
      id: l.id,
      user_id: l.userId,
      user_name: l.userName,
      user_role: l.userRole,
      action: l.action,
      details: l.details,
      target_type: l.targetType,
      target_id: l.targetId,
      timestamp: l.timestamp || new Date().toISOString(),
    }));

    const { error } = await supabase.from('audit_logs').upsert(logsPayload, { onConflict: 'id' });
    if (error) {
      console.error('❌ Failed to migrate audit logs:', error.message);
    } else {
      console.log(`✅ ${logsPayload.length} audit logs successfully migrated.`);
    }
  }

  console.log('\nMigration run completed. Verify table counts in Supabase Table Editor.');
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
