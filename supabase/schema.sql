-- ============================================================================
-- RAHI FLOWDESK — COMPLETE PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Single Source of Truth for Cloudflare Workers & Serverless Production
-- Copy-paste this entire file into your Supabase Dashboard SQL Editor to apply.
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'client')),
  permission_group TEXT NOT NULL CHECK (permission_group IN ('FULL_ADMIN_ACCESS', 'EMPLOYEE_ACCESS', 'CLIENT_ACCESS')),
  department TEXT,
  client_id TEXT,
  client_name TEXT,
  employee_id TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  phone TEXT DEFAULT '',
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  logo_url TEXT,
  service_package TEXT NOT NULL DEFAULT 'Full Marketing',
  contract_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  monthly_retainer NUMERIC NOT NULL DEFAULT 150000,
  currency TEXT NOT NULL DEFAULT 'INR',
  monthly_commitment JSONB NOT NULL DEFAULT '{"reels": 16, "marketingReels": 8, "posts": 12, "carousels": 4, "showreels": 2, "longVideos": 2}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_hold', 'archived')),
  primary_contact_name TEXT,
  notes TEXT DEFAULT '',
  archived_at TIMESTAMPTZ,
  archived_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  max_concurrent_tasks INT NOT NULL DEFAULT 5,
  current_active_tasks INT NOT NULL DEFAULT 0,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  performance_score INT NOT NULL DEFAULT 95,
  skills JSONB NOT NULL DEFAULT '["Creative Production"]'::jsonb,
  deactivated_at TIMESTAMPTZ,
  deactivated_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  progress INT NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE,
  deadline DATE,
  description TEXT DEFAULT '',
  objective TEXT DEFAULT '',
  assigned_employees JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  total_deliverables_target INT NOT NULL DEFAULT 0,
  completed_deliverables_count INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  archived_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  project_title TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  deliverable_id TEXT,
  assigned_employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_employee_name TEXT,
  assigned_employee_department TEXT,
  assigned_employee_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  start_date DATE DEFAULT CURRENT_DATE,
  deadline DATE,
  estimated_hours NUMERIC DEFAULT 4,
  description TEXT DEFAULT '',
  feedback_notes TEXT,
  required_output TEXT DEFAULT '',
  reference_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  submissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. DELIVERABLES TABLE (10-Stage Creative Workflow Tracker)
CREATE TABLE IF NOT EXISTS public.deliverables (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  project_title TEXT,
  type TEXT NOT NULL DEFAULT 'reel',
  target_month TEXT NOT NULL DEFAULT '2026-11',
  status TEXT NOT NULL DEFAULT 'in_progress',
  stage TEXT NOT NULL DEFAULT 'content_planning',
  assigned_employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_employee_name TEXT,
  deadline DATE,
  scheduled_publish_date DATE,
  media_url TEXT,
  thumbnail_url TEXT,
  script_text TEXT,
  script_approved BOOLEAN NOT NULL DEFAULT false,
  script_approved_at TIMESTAMPTZ,
  video_approved BOOLEAN NOT NULL DEFAULT false,
  video_approved_at TIMESTAMPTZ,
  current_version INT NOT NULL DEFAULT 1,
  versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_counted_towards_commitment BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CLIENT APPROVALS TABLE
CREATE TABLE IF NOT EXISTS public.client_approvals (
  id TEXT PRIMARY KEY,
  deliverable_id TEXT NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  deliverable_title TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  type TEXT NOT NULL DEFAULT 'video',
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  action TEXT,
  feedback TEXT,
  client_notes TEXT,
  categories JSONB DEFAULT '[]'::jsonb,
  signed_off_by TEXT,
  decision_date TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by_user_id TEXT,
  decided_by_user_name TEXT,
  recorded_by_admin_or_manager BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. SESSIONS TABLE (Persistent Cryptographic Session Tokens)
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permission_group TEXT NOT NULL,
  client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  target_role TEXT DEFAULT 'all_admin',
  recipient_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  related_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount NUMERIC DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'software',
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT,
  recorded_by_user_id TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. PASSWORD RESETS TABLE
CREATE TABLE IF NOT EXISTS public.password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_employee ON public.tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON public.deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_stage ON public.deliverables(stage);
CREATE INDEX IF NOT EXISTS idx_deliverables_target_month ON public.deliverables(target_month);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- SERVICE ROLE POLICIES (Bypasses RLS for secure server-side API handlers)
DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Clients" ON public.clients FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Employees" ON public.employees FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Projects" ON public.projects FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Tasks" ON public.tasks FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Deliverables" ON public.deliverables FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Approvals" ON public.client_approvals FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Sessions" ON public.sessions FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Invitations" ON public.invitations FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access AuditLogs" ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Invoices" ON public.invoices FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Payments" ON public.payments FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access Expenses" ON public.expenses FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Service Role Full Access PasswordResets" ON public.password_resets FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- DEFAULT SEED
INSERT INTO public.users (id, name, email, username, role, permission_group, department, status, password_hash)
VALUES (
  'usr-admin',
  'Rahi Creative Media',
  'admin@rahicreative.com',
  'admin',
  'admin',
  'FULL_ADMIN_ACCESS',
  'Creative Direction',
  'active',
  '298835821c179c1bc6130eb5a9a4918e:ab30ae04780bc404983adffc65dbe199e43b1ee65b797e88ca8840c8fa905e7144f7ea0e0f8c37d6e579ee5e11fc9b6579c351fcecf490f0559f2343fa925c4d'
)
ON CONFLICT (id) DO NOTHING;
