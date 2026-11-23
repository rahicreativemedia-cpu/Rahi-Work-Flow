import React, { useState, useEffect } from 'react';
import { Department, Employee } from '@/lib/types';
import { Modal } from '../common/Modal';
import { Eye, EyeOff, RefreshCw, Key } from 'lucide-react';

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
  const [username, setUsername] = useState((employeeToEdit as any)?.username || '');
  const [password, setPassword] = useState('emp123');
  const [showPassword, setShowPassword] = useState(false);
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

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name || '');
      setEmail(employeeToEdit.email || '');
      setUsername((employeeToEdit as any).username || employeeToEdit.email?.split('@')[0] || '');
      setPhone(employeeToEdit.phone || '');
      setDepartment(employeeToEdit.department || 'Video Editing');
      setDesignation(employeeToEdit.designation || 'Creative Specialist');
      setMaxConcurrentTasks(employeeToEdit.maxConcurrentTasks || 5);
      setSkills(employeeToEdit.skills ? employeeToEdit.skills.join(', ') : 'Premiere Pro, After Effects');
    } else {
      setName('');
      setEmail('');
      setUsername('');
      setPassword('emp123');
      setPhone('');
      setDepartment('Video Editing');
      setDesignation('Creative Specialist');
      setMaxConcurrentTasks(5);
      setSkills('Premiere Pro, After Effects');
    }
  }, [employeeToEdit, isOpen]);

  // Auto-suggest username when email is typed
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!employeeToEdit && (!username || username === email.split('@')[0])) {
      setUsername(val.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, ''));
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please fill out employee name and email.');
      return;
    }

    const finalUsername = (username.trim() || email.split('@')[0]).toLowerCase();

    onSubmit({
      id: employeeToEdit?.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: finalUsername,
      password: password.trim(),
      phone: phone.trim(),
      department,
      designation: designation.trim() || `${department} Specialist`,
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
      description="Admin & Manager Authority: Assign employee details, portal email, username, and initial login password directly."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vikram Mehta"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="editor@rahicreative.com"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
          />
        </div>

        {/* Credentials Section - Admin/Manager Sets Email & Password */}
        {!employeeToEdit && (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
              <Key className="w-3.5 h-3.5 text-black" />
              <span>Portal Login Credentials (Set by Management)</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-tight">
              Management sets the employee&apos;s username and initial password. Employees cannot change credentials themselves.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Login Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. vikram.m"
                  className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-stone-600 hover:text-black flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set login password"
                    className="w-full text-xs p-2 pr-8 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98200 12345"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium"
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
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Max Concurrent Tasks
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={maxConcurrentTasks}
              onChange={(e) => setMaxConcurrentTasks(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Designation</label>
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Senior Video Editor"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Skills (comma separated)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Premiere Pro, After Effects, Sound Design"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {employeeToEdit ? 'Save Changes' : 'Create Employee & Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
