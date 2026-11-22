import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { Modal } from '../common/Modal';
import { UploadCloud, FileVideo, CheckCircle2 } from 'lucide-react';

interface EmployeeSubmitWorkModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submissionData: {
    taskId: string;
    fileName: string;
    fileUrl: string;
    fileSize: string;
    notes: string;
  }) => void;
}

export function EmployeeSubmitWorkModal({
  task,
  isOpen,
  onClose,
  onSubmit,
}: EmployeeSubmitWorkModalProps) {
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4'
  );
  const [fileSize, setFileSize] = useState('34.2 MB');
  const [notes, setNotes] = useState('');

  if (!task) return null;

  const nextVersion = task.submissions.length + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      taskId: task.id,
      fileName: fileName.trim() || `${task.title.replace(/\s+/g, '_')}_v${nextVersion}.mp4`,
      fileUrl,
      fileSize,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Work — Version ${nextVersion}`}
      description={`${task.title} (${task.clientName})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Upload Simulation Card */}
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-center space-y-2">
          <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
          <div className="text-xs font-semibold text-slate-800">
            Upload Master Export / Deliverable File
          </div>
          <p className="text-[11px] text-slate-500">
            Supports MP4, MOV, Figma, PSD, or Google Drive / Frame.io links
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">File Name</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder={`e.g. ${task.title.replace(/\s+/g, '_')}_v${nextVersion}.mp4`}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Asset URL / Preview Link</label>
          <input
            type="text"
            required
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">File Size</label>
          <input
            type="text"
            value={fileSize}
            onChange={(e) => setFileSize(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Creative Notes & Changes Summary
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what was executed, changes made from previous feedback, or special instructions..."
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            rows={3}
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
            Submit for Review
          </button>
        </div>
      </form>
    </Modal>
  );
}
