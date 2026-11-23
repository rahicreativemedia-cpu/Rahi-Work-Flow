import React, { useState } from 'react';
import { Department, Employee } from '@/lib/types';
import { Modal } from '../common/Modal';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: any) => void;
  employeeToEdit?: Employee | null;
}

export function CreateEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  employeeToEdit,
}: CreateEmployeeModalProps) {
  const [name, setName] = useState(employeeToEdit?.name || '');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [phone, setPhone] = useState(employeeToEdit?.phone || '');
  const [department, setDepartment] = useState<Department>(
    employeeToEdit?.department || 'Video Editing'
  );
  const [designation, setDesignation] = useState(
    employeeToEdit?.designation || 'Creative Specialist'
  );
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(
    employeeToEdit?.maxConcurrentTasks || 5
  );
  const [skills, setSkills] = useState(
    employeeToEdit?.skills ? employeeToEdit.skills.join(', ') : 'Premiere Pro, After Effects'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please fill out employee name and email.');
      return;
    }

    onSubmit({
      id: employeeToEdit?.id,
      name,
      email,
      phone,
      department,
      designation: designation || `${department} Specialist`,
      maxConcurrentTasks: Number(maxConcurrentTasks),
      skills,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Edit Employee Profile' : 'Add Creative Employee'}
      description="Equal Admin Capability: Creates employee profile and system login credentials."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vikram Mehta"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="editor@rahicreative.com"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98200 12345"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
            >
              <option value="Video Production">Video Production</option>
              <option value="Video Editing">Video Editing</option>
              <option value="Graphic Design">Graphic Design</option>
              <option value="Scriptwriting">Scriptwriting</option>
              <option value="Social Media">Social Media</option>
              <option value="Content Planning">Content Planning</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Max Concurrent Tasks
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={maxConcurrentTasks}
              onChange={(e) => setMaxConcurrentTasks(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Senior Video Editor"
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Skills (comma separated)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Premiere Pro, After Effects, Sound Design"
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
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {employeeToEdit ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
