import React, { useState, useEffect } from 'react';
import { Project, Client, Employee, User, Priority, ProjectStatus } from '@/lib/types';
import { X, FolderPlus, Save, DollarSign, Calendar, Users, AlertCircle } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  employees: Employee[];
  users: User[];
  currentUser: User;
  projectToEdit?: Project | null;
  onSaveProject: (projectData: any) => Promise<void>;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  clients,
  employees,
  users,
  currentUser,
  projectToEdit,
  onSaveProject,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]);
  const [projectManagerId, setProjectManagerId] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [totalDeliverablesTarget, setTotalDeliverablesTarget] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setClientId(projectToEdit.clientId);
      setDescription(projectToEdit.description || '');
      setObjective(projectToEdit.objective || '');
      setStartDate(projectToEdit.startDate);
      setTargetEndDate(projectToEdit.targetEndDate);
      setPriority(projectToEdit.priority || 'medium');
      setStatus(projectToEdit.status || 'active');
      setAssignedEmployees(projectToEdit.assignedEmployees || []);
      setProjectManagerId(projectToEdit.projectManagerId || '');
      setBudget(projectToEdit.budget ? String(projectToEdit.budget) : '');
      setCurrency(projectToEdit.currency || 'INR');
      setTotalDeliverablesTarget(String(projectToEdit.totalDeliverablesTarget || 10));
    } else {
      setTitle('');
      setClientId(clients[0]?.id || '');
      setDescription('');
      setObjective('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setPriority('medium');
      setStatus('planning');
      setAssignedEmployees([]);
      setProjectManagerId(currentUser.id);
      setBudget('');
      setCurrency(clients[0]?.currency || 'INR');
      setTotalDeliverablesTarget('10');
    }
    setError(null);
  }, [projectToEdit, isOpen, clients, currentUser]);

  if (!isOpen) return null;

  const toggleEmployee = (empId: string) => {
    setAssignedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }
    if (!clientId) {
      setError('Please select a valid client.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSaveProject({
        id: projectToEdit?.id,
        clientId,
        title: title.trim(),
        description: description.trim(),
        objective: objective.trim(),
        startDate,
        targetEndDate,
        priority,
        status,
        assignedEmployees,
        projectManagerId: projectManagerId || undefined,
        budget: budget ? Number(budget) : undefined,
        currency,
        totalDeliverablesTarget: Number(totalDeliverablesTarget) || 10,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {projectToEdit ? 'Edit Agency Project' : 'Create New Agency Project'}
              </h3>
              <p className="text-xs text-slate-500">
                Connect clients, creative teams, objectives, and deliverables.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-lg text-xs text-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-black" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title <span className="text-black font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apex Q4 High-Performance Campaign"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black text-slate-900"
              />
            </div>

            {/* Client Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client Organization <span className="text-black font-bold">*</span>
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  const selClient = clients.find((c) => c.id === e.target.value);
                  if (selClient?.currency) setCurrency(selClient.currency);
                }}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="">Select a Client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            {/* Project Manager */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Manager
              </label>
              <select
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="">Select Manager / Lead...</option>
                {users
                  .filter((u) => u.role === 'admin' || u.role === 'manager')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level scope of work, deliverables summary, and deliverables cadence..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                rows={2}
              />
            </div>

            {/* Objective */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campaign Objective / Goal
              </label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="e.g. Generate 50,000 profile visits and 20% conversion lift on launch reel"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Target End Date / Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="planning">Planning</option>
                <option value="not_started">Not Started</option>
                <option value="active">Active (In Progress)</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Deliverables Target */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deliverables Target Count
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalDeliverablesTarget}
                onChange={(e) => setTotalDeliverablesTarget(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Budget & Currency */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Budget (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Assigned Team Members Multi-Select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Assign Creative Team Members:</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {assignedEmployees.length} employee(s) selected
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                {employees.map((emp) => {
                  const isSelected = assignedEmployees.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={`text-left p-2 rounded-lg border text-xs transition-all flex flex-col ${
                        isSelected
                          ? 'bg-black border-black text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold truncate">{emp.name}</span>
                      <span className="text-[10px] text-neutral-400 truncate">{emp.department}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
