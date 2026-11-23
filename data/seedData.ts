import { AppState } from '../lib/types';

export const initialData: AppState = {
  users: [
    {
      id: 'usr-admin',
      name: 'Rahi Creative Media',
      email: 'admin@rahicreative.com',
      username: 'admin',
      role: 'admin',
      permissionGroup: 'FULL_ADMIN_ACCESS',
      department: 'Creative Direction',
      status: 'active',
      phone: '',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  clients: [],
  employees: [],
  projects: [],
  tasks: [],
  deliverables: [],
  approvals: [],
  notifications: [],
  invitations: [],
  auditLogs: [],
  passwordResets: [],
  sessions: [],
  invoices: [],
  payments: [],
  expenses: [],
};
