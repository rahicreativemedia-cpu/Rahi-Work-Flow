import React, { useState } from 'react';
import { Client, Deliverable, User } from '@/lib/types';
import { formatCurrency, calculateClientDeliverableStats } from '@/lib/utils';
import { hasFullAdminAccess } from '@/lib/permissions';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import {
  Briefcase,
  Calendar,
  Award,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  deliverables: Deliverable[];
  currentUser: User;
  onCreateClient: () => void;
  onEditClient: (client: Client) => void;
  onSelectClientDeliverables: (client: Client) => void;
}

export function ClientList({
  clients,
  deliverables,
  currentUser,
  onCreateClient,
  onEditClient,
  onSelectClientDeliverables,
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');

  const canAdmin = hasFullAdminAccess(currentUser);

  const filteredClients = clients.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.company.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (packageFilter !== 'all' && c.servicePackage !== packageFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search clients by brand, company name or contact..."
        filters={[
          {
            label: 'Service Package',
            value: packageFilter,
            options: [
              { label: 'All Packages', value: 'all' },
              { label: 'Full Marketing', value: 'Full Marketing' },
              { label: 'Video Editing Only', value: 'Video Editing Only' },
              { label: 'Marketing Management Only', value: 'Marketing Management Only' },
              { label: 'Custom Retainer', value: 'Custom Retainer' },
            ],
            onChange: setPackageFilter,
          },
        ]}
        actionButton={
          canAdmin ? (
            <button
              onClick={onCreateClient}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const stats = calculateClientDeliverableStats(client, deliverables);

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={client.status === 'active' ? 'emerald' : 'slate'}>
                    {client.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {formatCurrency(client.monthlyRetainer, client.currency)}/mo
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm overflow-hidden shrink-0">
                    {client.logoUrl ? (
                      <img
                        src={client.logoUrl}
                        alt={client.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      client.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{client.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{client.company}</p>
                  </div>
                </div>

                {/* Package & Commitment summary */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Service Package:</span>
                    <strong className="text-slate-800">{client.servicePackage}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Monthly Target:</span>
                    <strong className="text-slate-900">{stats.totalCommitment} assets ({client.monthlyCommitment.reels} Reels)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Contract Period:</span>
                    <span className="text-slate-700 text-[11px]">
                      {client.contractStartDate} to {client.contractEndDate}
                    </span>
                  </div>
                </div>

                {/* Real-time delivery counter */}
                <div className="mt-3 flex items-center justify-between text-xs px-1">
                  <span className="text-slate-500">
                    Delivered: <strong>{stats.completed}</strong> / {stats.totalCommitment}
                  </span>
                  <span className="font-bold text-emerald-700">{stats.completionPercentage}%</span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectClientDeliverables(client)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Deliverables</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                {canAdmin && (
                  <button
                    onClick={() => onEditClient(client)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                  >
                    Edit / Targets
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
