import React, { useState } from 'react';
import { AuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { ShieldCheck, History, Filter, Search } from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export function AuditLogsView({ auditLogs }: AuditLogsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      if (!matchDetails && !matchAction && !matchUser) return false;
    }
    if (targetTypeFilter !== 'all' && log.targetType !== targetTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-black" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Security & System Audit Logs
          </h2>
          <span className="text-[11px] font-semibold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
            Immutable Audit Trail
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Every administrative action, account modification, assignment, deliverable transition, and client approval is recorded for transparency.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by user, action or keyword..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
        >
          <option value="all">All Event Categories</option>
          <option value="client">Client Events</option>
          <option value="task">Task & Assignment Events</option>
          <option value="deliverable">Deliverable & Stage Events</option>
          <option value="approval">Client Approval Events</option>
          <option value="auth">Authentication & Invites</option>
          <option value="employee">Employee Management</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-4 capitalize">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border bg-neutral-100 text-neutral-900 border-neutral-300"
                    >
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">{log.details}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase">
                      {log.targetType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
