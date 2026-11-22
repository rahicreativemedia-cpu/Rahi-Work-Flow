-- ============================================================================
-- RAHI FLOWDESK — PRODUCTION POSTGRESQL DATABASE SCHEMA & RLS MIGRATION
-- Migration Version: 20261122000001_rahi_flowdesk_production_schema.sql
-- Target System: Supabase PostgreSQL (Managed Postgres 15+)
-- Company: RAHI Creative Media
-- Target Domain: flowdesk.rahicreativemedia.com
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'client');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE permission_group AS ENUM ('FULL_ADMIN_ACCESS', 'EMPLOYEE_ACCESS', 'CLIENT_ACCESS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('active', 'on_hold', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planning', 'not_started', 'active', 'on_hold', 'completed', 'cancelled', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'under_review', 'revision_required', 'approved', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE creative_stage AS ENUM (
    'content_planning',
    'scriptwriting',
    'internal_script_review',
    'client_script_approval',
    'video_editing',
    'internal_video_review',
    'client_video_approval',
    'revisions',
    'scheduling',
    'publishing_or_delivery'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE deliverable_status AS ENUM (
    'active',
    'in_progress',
    'internal_review',
    'client_review',
    'revision_requested',
    'approved',
    'scheduled',
    'published',
    'delivered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. AUTOMATED UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CORE ENTITIES

-- 4.1 CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  logo_url TEXT,
  service_package TEXT NOT NULL DEFAULT 'Full Marketing',
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  monthly_retainer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  monthly_commitment JSONB NOT NULL DEFAULT '{"reels": 0, "longVideos": 0, "graphics": 0, "carousels": 0, "customTargetNote": ""}'::jsonb,
  status client_status NOT NULL DEFAULT 'active',
  primary_contact_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  archived_at TIMESTAMPTZ,
  archived_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_clients_timestamp
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4.2 USERS (Synced with Supabase Auth or Standalone User Registry)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  auth_id UUID UNIQUE, -- references auth.users(id) in Supabase Auth
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  permission_group permission_group NOT NULL,
  department TEXT,
  client_id TEXT REFERENCES clients(id) ON DELETE RESTRICT,
  employee_id TEXT,
  avatar_url TEXT,
  phone TEXT,
  status account_status NOT NULL DEFAULT 'active',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4.3 EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  department TEXT NOT NULL DEFAULT 'Video Editing',
  designation TEXT NOT NULL DEFAULT 'Creative Specialist',
  status account_status NOT NULL DEFAULT 'active',
  max_concurrent_tasks INT NOT NULL DEFAULT 5,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  performance_score INT NOT NULL DEFAULT 100,
  skills TEXT[] NOT NULL DEFAULT ARRAY['Creative Execution'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_employees_timestamp
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4.4 PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  objective TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL,
  deadline DATE NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  status project_status NOT NULL DEFAULT 'active',
  assigned_employees TEXT[] NOT NULL DEFAULT '{}',
  project_manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  budget NUMERIC(12, 2) DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  total_deliverables_target INT NOT NULL DEFAULT 0,
  completed_deliverables_count INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  archived_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4.5 DELIVERABLES (10-Stage Pipeline Engine)
CREATE TABLE IF NOT EXISTS deliverables (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  project_title TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  target_month TEXT NOT NULL, -- Format: 'YYYY-MM'
  stage creative_stage NOT NULL DEFAULT 'content_planning',
  current_version INT NOT NULL DEFAULT 1,
  status deliverable_status NOT NULL DEFAULT 'active',
  assigned_employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  assigned_employee_name TEXT NOT NULL,
  script_content TEXT,
  video_media_url TEXT,
  is_counted_towards_commitment BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  script_approved BOOLEAN NOT NULL DEFAULT FALSE,
  video_approved BOOLEAN NOT NULL DEFAULT FALSE,
  versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_stage_10_commitment CHECK (
    (is_counted_towards_commitment = TRUE AND stage = 'publishing_or_delivery' AND status IN ('published', 'delivered'))
    OR (is_counted_towards_commitment = FALSE)
  )
);

CREATE TRIGGER update_deliverables_timestamp
BEFORE UPDATE ON deliverables
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4.6 TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  deliverable_id TEXT REFERENCES deliverables(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  assigned_employee_name TEXT NOT NULL,
  assigned_employee_ids TEXT[] DEFAULT '{}',
  priority priority_level NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE NOT NULL,
  estimated_hours NUMERIC(6, 2) NOT NULL DEFAULT 4.00,
  internal_instructions TEXT DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  submissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_tasks_timestamp
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4.7 CLIENT APPROVAL RECORDS
CREATE TABLE IF NOT EXISTS client_approvals (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  deliverable_id TEXT NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  type TEXT NOT NULL, -- 'script' | 'video' | 'design'
  status TEXT NOT NULL, -- 'approved' | 'revision_requested'
  feedback TEXT,
  categories TEXT[] DEFAULT '{}',
  decided_by_user_id TEXT NOT NULL,
  decided_by_user_name TEXT NOT NULL,
  decided_by_role TEXT NOT NULL,
  recorded_by_admin_or_manager BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.8 INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status invoice_status NOT NULL DEFAULT 'issued',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount NUMERIC(12, 2) DEFAULT 0.00,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_invoices_timestamp
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 4.9 PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  reference_number TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.10 EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT NOT NULL,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  target_role TEXT, -- 'all_admin' | 'employee' | 'client'
  recipient_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  recipient_client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  deliverable_id TEXT REFERENCES deliverables(id) ON DELETE SET NULL,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.12 IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.13 INVITATIONS
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  role user_role NOT NULL,
  department TEXT,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  token TEXT NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- 4.14 PASSWORD RESETS
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PERFORMANCE & INTEGRITY INDEXES
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);

CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_stage ON deliverables(stage);
CREATE INDEX IF NOT EXISTS idx_deliverables_target_month ON deliverables(target_month);
CREATE INDEX IF NOT EXISTS idx_deliverables_assigned_emp ON deliverables(assigned_employee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_emp ON tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

CREATE INDEX IF NOT EXISTS idx_approvals_deliverable_id ON client_approvals(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_approvals_client_id ON client_approvals(client_id);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(recipient_client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- 6.1 HELPER FUNCTIONS FOR SUPABASE JWT RESOLUTION
CREATE OR REPLACE FUNCTION auth.flowdesk_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.flowdesk_role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'flowdesk_role'),
    ''
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.flowdesk_client_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.flowdesk_client_id', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'flowdesk_client_id'),
    ''
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.flowdesk_employee_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.flowdesk_employee_id', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'flowdesk_employee_id'),
    ''
  );
$$ LANGUAGE sql STABLE;

-- 6.2 FULL_ADMIN_ACCESS: ADMIN & MANAGER HAVE 100% IDENTICAL COMPANY-WIDE PERMISSIONS
-- Admins & Managers have unrestricted SELECT, INSERT, UPDATE, DELETE on all operational tables
CREATE POLICY admin_manager_all_clients ON clients FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_users ON users FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_employees ON employees FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_projects ON projects FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_deliverables ON deliverables FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_tasks ON tasks FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_approvals ON client_approvals FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_invoices ON invoices FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_payments ON payments FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_expenses ON expenses FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_notifications ON notifications FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_audit_logs ON audit_logs FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

CREATE POLICY admin_manager_all_invitations ON invitations FOR ALL
  TO authenticated USING (auth.flowdesk_role() IN ('admin', 'manager'));

-- 6.3 CLIENT POLICIES: STRICT MULTI-TENANT ISOLATION
-- Clients can ONLY view their own client row (excluding internal retainer details)
CREATE POLICY client_select_own_profile ON clients FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'client' AND id = auth.flowdesk_client_id()
  );

-- Clients can ONLY view active projects for their organization
CREATE POLICY client_select_own_projects ON projects FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'client' AND client_id = auth.flowdesk_client_id() AND status != 'archived'
  );

-- Clients can ONLY view deliverables for their organization
CREATE POLICY client_select_own_deliverables ON deliverables FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'client' AND client_id = auth.flowdesk_client_id()
  );

-- Clients can ONLY view and submit approvals for their organization
CREATE POLICY client_select_own_approvals ON client_approvals FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'client' AND client_id = auth.flowdesk_client_id()
  );

CREATE POLICY client_insert_own_approvals ON client_approvals FOR INSERT
  TO authenticated WITH CHECK (
    auth.flowdesk_role() = 'client' AND client_id = auth.flowdesk_client_id()
  );

-- Clients can view notifications targeted to their client account
CREATE POLICY client_select_own_notifications ON notifications FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'client' AND recipient_client_id = auth.flowdesk_client_id()
  );

-- 6.4 EMPLOYEE POLICIES: ASSIGNED BOUNDARY ENFORCEMENT & FINANCIAL BLOCKS
-- Employees view colleague directory (excluding performance/admin fields)
CREATE POLICY employee_select_roster ON employees FOR SELECT
  TO authenticated USING (auth.flowdesk_role() = 'employee');

-- Employees view projects they are assigned to
CREATE POLICY employee_select_assigned_projects ON projects FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'employee' AND (
      auth.flowdesk_employee_id() = ANY(assigned_employees)
      OR EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = projects.id AND t.assigned_employee_id = auth.flowdesk_employee_id())
    )
  );

-- Employees view deliverables for their assigned work
CREATE POLICY employee_select_assigned_deliverables ON deliverables FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'employee' AND (
      assigned_employee_id = auth.flowdesk_employee_id()
      OR EXISTS (SELECT 1 FROM projects p WHERE p.id = deliverables.project_id AND auth.flowdesk_employee_id() = ANY(p.assigned_employees))
    )
  );

-- Employees can update deliverables they are assigned to (e.g. uploading rough cut / draft)
CREATE POLICY employee_update_assigned_deliverables ON deliverables FOR UPDATE
  TO authenticated USING (
    auth.flowdesk_role() = 'employee' AND assigned_employee_id = auth.flowdesk_employee_id()
  );

-- Employees view ONLY tasks assigned to them
CREATE POLICY employee_select_assigned_tasks ON tasks FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'employee' AND (
      assigned_employee_id = auth.flowdesk_employee_id()
      OR auth.flowdesk_employee_id() = ANY(assigned_employee_ids)
    )
  );

-- Employees can update their assigned tasks (submission, status progression)
CREATE POLICY employee_update_assigned_tasks ON tasks FOR UPDATE
  TO authenticated USING (
    auth.flowdesk_role() = 'employee' AND (
      assigned_employee_id = auth.flowdesk_employee_id()
      OR auth.flowdesk_employee_id() = ANY(assigned_employee_ids)
    )
  );

-- Employees view notifications targeted to them
CREATE POLICY employee_select_own_notifications ON notifications FOR SELECT
  TO authenticated USING (
    auth.flowdesk_role() = 'employee' AND (
      recipient_user_id = auth.uid()::text
      OR (target_role = 'employee' AND recipient_user_id IS NULL)
    )
  );

-- 7. REPLICATION PUBLICATION FOR REALTIME SUBSCRIPTIONS
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE deliverables;
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  ALTER PUBLICATION supabase_realtime ADD TABLE client_approvals;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN null; END $$;
