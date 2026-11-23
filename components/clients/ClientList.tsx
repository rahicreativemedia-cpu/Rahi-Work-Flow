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
  ExternalLink,
  Mail,
  Phone,
  UserCheck,
  AlertTriangle,
  Power,
} from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  deliverables: Deliverable[];
  currentUser: User;
  onCreateClient: () => void;
  onEditClient: (client: Client) => void;
  onSelectClientDeliverables: (client: Client) => void;
  onToggleStatus?: (client: Client) => void;
}

export function ClientList({
  clients,
  deliverables,
  currentUser,
  onCreateClient,
  onEditClient,
  onSelectClientDeliverables,
  onToggleStatus,
}: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const canAdmin = hasFullAdminAccess(currentUser);

  const filteredClients = clients.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCompany = c.company?.toLowerCase().includes(q);
      const matchContact = c.primaryContactName?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchContact && !matchEmail && !matchPhone) {
        return false;
      }
    }
    if (packageFilter !== 'all' && c.servicePackage !== packageFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search clients by brand, legal entity, contact person, email, or phone..."
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
          {
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'all' },
              { label: 'Active Clients', value: 'active' },
              { label: 'Inactive Clients', value: 'inactive' },
            ],
            onChange: setStatusFilter,
          },
        ]}
        actionButton={
          canAdmin ? (
            <button
              onClick={onCreateClient}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          ) : null
        }
      />

      {/* Grid of Client Cards */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
          <Briefcase className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-900">No clients match your filter</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, package, or status filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const stats = calculateClientDeliverableStats(client, deliverables, '2026-11');
            const isActive = client.status === 'active';

            return (
              <div
                key={client.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isActive ? 'border-neutral-200 hover:border-neutral-300' : 'border-neutral-200 opacity-75 bg-neutral-50/50'
                }`}
              >
                <div>
                  {/* Top Badges: Status + Retainer / Package */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={isActive ? 'emerald' : 'slate'}>
                      {client.status.toUpperCase()}
                    </Badge>
                    {canAdmin && client.monthlyRetainer !== undefined ? (
                      <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                        {formatCurrency(client.monthlyRetainer, client.currency)}/mo
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {client.servicePackage}
                      </span>
                    )}
                  </div>

                  {/* Client Brand Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center font-black text-neutral-700 text-sm overflow-hidden shrink-0">
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
                      <h3 className="text-base font-bold text-neutral-900 truncate">{client.name}</h3>
                      <p className="text-xs text-neutral-500 truncate">{client.company}</p>
                    </div>
                  </div>

                  {/* Primary Contact Details */}
                  <div className="mt-3 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1 text-neutral-600">
                    <div className="flex items-center gap-1.5 font-medium text-neutral-900">
                      <UserCheck className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                      <span className="truncate">{client.primaryContactName || 'Primary Contact'}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 truncate">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Package & Target Breakdown */}
                  <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 font-medium">Service Package:</span>
                      <strong className="text-neutral-900 font-semibold">{client.servicePackage}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 font-medium">Monthly Target:</span>
                      <strong className="text-neutral-900 font-bold">
                        {stats.totalCommitment} deliverables
                      </strong>
                    </div>
                    {/* Specific Deliverable Targets Breakdown */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-200 text-[10px]">
                      <span className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 text-neutral-800 font-medium">
                        {client.monthlyCommitment?.reels ?? 0} Reels
                      </span>
                      <span className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 text-neutral-800 font-medium">
                        {client.monthlyCommitment?.longVideos ?? 0} Long Videos
                      </span>
                      <span className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 text-neutral-800 font-medium">
                        {client.monthlyCommitment?.graphics ?? 0} Graphics
                      </span>
                      <span className="px-1.5 py-0.5 bg-white rounded border border-neutral-300 text-neutral-800 font-medium">
                        {client.monthlyCommitment?.carousels ?? 0} Carousels
                      </span>
                    </div>
                    {client.monthlyCommitment?.customTargetNote && (
                      <p className="text-[10px] text-neutral-500 italic mt-1 truncate">
                        Note: {client.monthlyCommitment.customTargetNote}
                      </p>
                    )}
                  </div>

                  {/* Real-Time Monthly Delivery Progress & Pacing */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs px-0.5">
                      <span className="text-neutral-500 font-medium">
                        Delivered: <strong className="text-neutral-900">{stats.completed}</strong> / {stats.totalCommitment}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stats.pacing.pacingBadgeClass}`}>
                        {stats.pacing.pacingLabel}
                      </span>
                    </div>

                    <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-black h-full rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectClientDeliverables(client)}
                    className="text-xs font-semibold text-neutral-900 hover:text-black underline flex items-center gap-1 transition-colors"
                  >
                    <span>View Deliverables</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {canAdmin && (
                    <div className="flex items-center gap-1.5">
                      {onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(client)}
                          title={isActive ? 'Deactivate Client' : 'Activate Client'}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            isActive
                              ? 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                              : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditClient(client)}
                        className="text-xs font-medium text-neutral-800 hover:text-black px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 transition-colors"
                      >
                        Edit Profile & Targets
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
