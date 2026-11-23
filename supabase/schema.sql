-- ============================================================================
-- RAHI FLOWDESK — SUPABASE POSTGRESQL SCHEMA & INITIAL SEED
-- Database Architecture: PostgreSQL 15+ (Supabase)
-- Domain: flowdesk.rahicreativemedia.com
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
  phone TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  logo_url TEXT,
  service_package TEXT NOT NULL DEFAULT 'Full Marketing',
  contract_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_end_date DATE NOT NULL,
  monthly_retainer NUMERIC NOT NULL DEFAULT 150000,
  currency TEXT NOT NULL DEFAULT 'INR',
  monthly_commitment JSONB NOT NULL DEFAULT '{"reels": 16, "longVideos": 2, "graphics": 6, "carousels": 4}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_hold')),
  primary_contact_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  max_concurrent_tasks INT NOT NULL DEFAULT 5,
  current_active_tasks INT NOT NULL DEFAULT 0,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  performance_score INT NOT NULL DEFAULT 95,
  skills JSONB NOT NULL DEFAULT '["Creative Production"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planning',
  progress INT NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  deadline DATE,
  description TEXT,
  assigned_employees JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  deadline DATE,
  description TEXT,
  feedback_notes TEXT,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  submissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. DELIVERABLES TABLE (10-Stage Creative Workflow Tracker)
CREATE TABLE IF NOT EXISTS public.deliverables (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'reel',
  status TEXT NOT NULL DEFAULT 'in_progress',
  stage TEXT NOT NULL DEFAULT 'content_planning',
  assigned_employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
  deadline DATE,
  scheduled_publish_date DATE,
  media_url TEXT,
  current_version INT NOT NULL DEFAULT 1,
  versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CLIENT APPROVALS TABLE
CREATE TABLE IF NOT EXISTS public.client_approvals (
  id TEXT PRIMARY KEY,
  deliverable_id TEXT NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  client_notes TEXT,
  signed_off_by TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  client_id TEXT,
  client_name TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. AUDIT LOGS TABLE
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

-- 11. FINANCE TABLES
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_date DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES FOR HIGH QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_employee ON public.tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON public.deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_stage ON public.deliverables(stage);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- POLICIES: Service Role has full administrative bypass; Public anon has controlled API access
CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Clients" ON public.clients FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Employees" ON public.employees FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Projects" ON public.projects FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Tasks" ON public.tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Deliverables" ON public.deliverables FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Approvals" ON public.client_approvals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Invitations" ON public.invitations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access AuditLogs" ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Invoices" ON public.invoices FOR ALL USING (auth.role() = 'service_role');

-- DEFAULT ADMINISTRATOR SEED
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
