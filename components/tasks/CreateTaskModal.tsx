import React, { useState } from 'react';
import { Client, Project, Employee, Priority, Deliverable } from '@/lib/types';
import { TODAY_STRING, getWorkloadCapacityInfo } from '@/lib/utils';
import { Modal } from '../common/Modal';
import { AlertTriangle, UserCheck } from 'lucide-react';

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

  const selectedEmployee = employees.find((e) => e.id === assignedEmployeeId);
  const selectedCapInfo = selectedEmployee
    ? getWorkloadCapacityInfo(
        selectedEmployee.currentActiveTasks,
        selectedEmployee.maxConcurrentTasks
      )
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId || !assignedEmployeeId) {
      alert('Please fill out all required fields.');
      return;
    }

    onCreateTask({
      title: title.trim(),
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
      description="Assign creative work, video editing, graphic design, or copywriting with capacity checks."
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
              onChange={(e) => {
                setClientId(e.target.value);
                const nextProjects = projects.filter((p) => p.clientId === e.target.value);
                setProjectId(nextProjects[0]?.id || '');
              }}
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
              Assign to Creative Specialist *
            </label>
            <select
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              {employees.map((emp) => {
                const cap = getWorkloadCapacityInfo(emp.currentActiveTasks, emp.maxConcurrentTasks);
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department}) — {emp.currentActiveTasks}/{emp.maxConcurrentTasks} ({cap.label})
                  </option>
                );
              })}
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

        {/* Overloaded Warning Banner */}
        {selectedCapInfo?.isOverloaded && (
          <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-lg flex items-start gap-2.5 text-xs text-black">
            <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Capacity Alert:</strong> {selectedEmployee?.name} is currently at maximum capacity ({selectedEmployee?.currentActiveTasks}/{selectedEmployee?.maxConcurrentTasks} tasks). Assigning this task will overload their queue.
            </div>
          </div>
        )}

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
            <option value="">None (Independent Operational Task)</option>
            {filteredDeliverables.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} (Stage {d.stage} • {d.clientName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Instructions & Creative Brief
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide shooting direction, pacing requirements, hook details, sound notes..."
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Required Creative Output
          </label>
          <input
            type="text"
            value={requiredOutput}
            onChange={(e) => setRequiredOutput(e.target.value)}
            placeholder="e.g. 1080x1920 9:16 MP4 under 30 seconds with subtitles"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Assign Task
          </button>
        </div>
      </form>
    </Modal>
  );
}
