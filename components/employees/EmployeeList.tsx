import React, { useState } from 'react';
import { Employee, Department, User } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import { Users, Plus, Award, CheckCircle2, AlertCircle, Briefcase, Mail, Phone } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  currentUser: User;
  onCreateEmployee: () => void;
  onEditEmployee?: (employee: Employee) => void;
}

export function EmployeeList({
  employees,
  currentUser,
  onCreateEmployee,
  onEditEmployee,
}: EmployeeListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const canAdmin = hasFullAdminAccess(currentUser);

  const filteredEmployees = employees.filter((emp) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!emp.name.toLowerCase().includes(q) && !emp.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (deptFilter !== 'all' && emp.department !== deptFilter) return false;
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
              { label: 'Video Editing', value: 'Video Editing' },
              { label: 'Graphic Design', value: 'Graphic Design' },
              { label: 'Scriptwriting', value: 'Scriptwriting' },
              { label: 'Social Media', value: 'Social Media' },
              { label: 'Content Planning', value: 'Content Planning' },
            ],
            onChange: setDeptFilter,
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
          const workloadPercentage = Math.min(
            100,
            Math.round((emp.currentActiveTasks / emp.maxConcurrentTasks) * 100)
          );
          const isHighWorkload = workloadPercentage >= 80;

          return (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="blue">{emp.department}</Badge>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {emp.performanceScore}% Quality Score
                  </span>
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

                {/* Workload Progress */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">Active Workload:</span>
                    <span
                      className={`font-bold ${
                        isHighWorkload ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {emp.currentActiveTasks} / {emp.maxConcurrentTasks} tasks
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHighWorkload ? 'bg-rose-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${workloadPercentage}%` }}
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

              {canAdmin && onEditEmployee && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => onEditEmployee(emp)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
