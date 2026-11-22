import React, { useState } from 'react';
import { Employee, Department, User } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getWorkloadCapacityInfo } from '@/lib/utils';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import {
  Users,
  Plus,
  Award,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Mail,
  Phone,
  UserX,
  UserCheck,
} from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  currentUser: User;
  onCreateEmployee: () => void;
  onEditEmployee?: (employee: Employee) => void;
  onDeactivateEmployee?: (employee: Employee) => void;
}

export function EmployeeList({
  employees,
  currentUser,
  onCreateEmployee,
  onEditEmployee,
  onDeactivateEmployee,
}: EmployeeListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');

  const canAdmin = hasFullAdminAccess(currentUser);

  const filteredEmployees = employees.filter((emp) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!emp.name.toLowerCase().includes(q) && !emp.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (deptFilter !== 'all' && emp.department !== deptFilter) return false;

    if (capacityFilter !== 'all') {
      const capInfo = getWorkloadCapacityInfo(emp.currentActiveTasks, emp.maxConcurrentTasks);
      if (capInfo.status !== capacityFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search creative team by name or email..."
        filters={[
          {
            label: 'Department',
            value: deptFilter,
            options: [
              { label: 'All Departments', value: 'all' },
              { label: 'Video Production', value: 'Video Production' },
              { label: 'Video Editing', value: 'Video Editing' },
              { label: 'Graphic Design', value: 'Graphic Design' },
              { label: 'Scriptwriting', value: 'Scriptwriting' },
              { label: 'Social Media', value: 'Social Media' },
              { label: 'Content Planning', value: 'Content Planning' },
              { label: 'Operations', value: 'Operations' },
            ],
            onChange: setDeptFilter,
          },
          {
            label: 'Capacity',
            value: capacityFilter,
            options: [
              { label: 'All Capacity Levels', value: 'all' },
              { label: 'Optimal (40-79%)', value: 'optimal' },
              { label: 'Near Capacity (80-99%)', value: 'near_capacity' },
              { label: 'Overloaded (100%+)', value: 'overloaded' },
              { label: 'Under-Capacity (<40%)', value: 'under_capacity' },
            ],
            onChange: setCapacityFilter,
          },
        ]}
        actionButton={
          canAdmin ? (
            <button
              onClick={onCreateEmployee}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map((emp) => {
          const capInfo = getWorkloadCapacityInfo(emp.currentActiveTasks, emp.maxConcurrentTasks);
          const isInactive = emp.status === 'inactive';

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                isInactive ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="blue">{emp.department}</Badge>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${capInfo.badgeClass}`}>
                      {capInfo.label}
                    </span>
                    {emp.performanceScore && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {emp.performanceScore}% Score
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {emp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">{emp.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>

                {/* Workload Capacity Progress Bar */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Workload Distribution:</span>
                    <span
                      className={`font-bold ${
                        capInfo.isOverloaded
                          ? 'text-rose-600'
                          : capInfo.isHigh
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {emp.currentActiveTasks} / {emp.maxConcurrentTasks} tasks ({capInfo.percentage}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${capInfo.barColor}`}
                      style={{ width: `${Math.min(100, capInfo.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Skills tags */}
                {emp.skills && emp.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {emp.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {canAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Status: <strong className={isInactive ? 'text-rose-600' : 'text-emerald-600'}>{emp.status}</strong>
                  </span>
                  <div className="flex items-center gap-3">
                    {onEditEmployee && (
                      <button
                        onClick={() => onEditEmployee(emp)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Edit Profile
                      </button>
                    )}
                    {onDeactivateEmployee && !isInactive && (
                      <button
                        onClick={() => onDeactivateEmployee(emp)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Deactivate</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
