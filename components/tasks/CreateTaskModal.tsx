import React, { useState } from 'react';
import { Client, Project, Employee, Priority, Deliverable } from '@/lib/types';
import { TODAY_STRING } from '@/lib/utils';
import { Modal } from '../common/Modal';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  employees: Employee[];
  deliverables: Deliverable[];
  onCreateTask: (taskData: any) => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  clients,
  projects,
  employees,
  deliverables,
  onCreateTask,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [deliverableId, setDeliverableId] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(employees[0]?.id || '');
  const [priority, setPriority] = useState<Priority>('medium');
  const [startDate, setStartDate] = useState(TODAY_STRING);
  const [deadline, setDeadline] = useState('2026-11-28');
  const [description, setDescription] = useState('');
  const [requiredOutput, setRequiredOutput] = useState('');

  const filteredProjects = projects.filter((p) => !clientId || p.clientId === clientId);
  const filteredDeliverables = deliverables.filter((d) => !clientId || d.clientId === clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId || !assignedEmployeeId) {
      alert('Please fill out all required fields.');
      return;
    }

    onCreateTask({
      title,
      clientId,
      projectId: projectId || filteredProjects[0]?.id || '',
      deliverableId: deliverableId || undefined,
      assignedEmployeeId,
      priority,
      startDate,
      deadline,
      description,
      requiredOutput: requiredOutput || 'Completed asset meeting agency quality standards.',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create & Assign New Task"
      description="Assign creative work, video editing, graphic design, or copywriting."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cut 30s Reel with motion typography"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign to Employee *
            </label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deadline *</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Linked Deliverable (Optional)
          </label>
          <select
            value={deliverableId}
            onChange={(e) => setDeliverableId(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
          >
            <option value="">None (Independent task)</option>
            {filteredDeliverables.map((del) => (
              <option key={del.id} value={del.id}>
                {del.title} ({del.stage})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description & Creative Brief</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed instructions, raw footage drives, pacing notes..."
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Required Output Specs</label>
          <input
            type="text"
            value={requiredOutput}
            onChange={(e) => setRequiredOutput(e.target.value)}
            placeholder="e.g. 1080x1920 MP4 60fps with subtitles"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
