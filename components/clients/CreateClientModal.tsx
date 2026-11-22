import React, { useState, useEffect } from 'react';
import { Client, ServicePackage } from '@/lib/types';
import { TODAY_STRING } from '@/lib/utils';
import { Modal } from '../common/Modal';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clientData: any) => void;
  clientToEdit?: Client | null;
}

export function CreateClientModal({
  isOpen,
  onClose,
  onSubmit,
  clientToEdit,
}: CreateClientModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [servicePackage, setServicePackage] = useState<ServicePackage>('Full Marketing');
  const [monthlyRetainer, setMonthlyRetainer] = useState(200000);
  const [currency, setCurrency] = useState('INR');
  const [contractStartDate, setContractStartDate] = useState(TODAY_STRING);
  const [contractEndDate, setContractEndDate] = useState('2027-11-22');
  const [reels, setReels] = useState(16);
  const [longVideos, setLongVideos] = useState(2);
  const [graphics, setGraphics] = useState(6);
  const [carousels, setCarousels] = useState(4);
  const [customTargetNote, setCustomTargetNote] = useState('');

  // Sync state when clientToEdit or isOpen changes
  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setCompany(clientToEdit.company || '');
      setEmail(clientToEdit.email || '');
      setPhone(clientToEdit.phone || '');
      setPrimaryContactName(clientToEdit.primaryContactName || '');
      setLogoUrl(clientToEdit.logoUrl || '');
      setServicePackage(clientToEdit.servicePackage || 'Full Marketing');
      setMonthlyRetainer(clientToEdit.monthlyRetainer ?? 200000);
      setCurrency(clientToEdit.currency || 'INR');
      setContractStartDate(clientToEdit.contractStartDate || TODAY_STRING);
      setContractEndDate(clientToEdit.contractEndDate || '2027-11-22');
      setReels(clientToEdit.monthlyCommitment?.reels ?? 16);
      setLongVideos(clientToEdit.monthlyCommitment?.longVideos ?? 2);
      setGraphics(clientToEdit.monthlyCommitment?.graphics ?? 6);
      setCarousels(clientToEdit.monthlyCommitment?.carousels ?? 4);
      setCustomTargetNote(clientToEdit.monthlyCommitment?.customTargetNote || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setPrimaryContactName('');
      setLogoUrl('');
      setServicePackage('Full Marketing');
      setMonthlyRetainer(200000);
      setCurrency('INR');
      setContractStartDate(TODAY_STRING);
      setContractEndDate('2027-11-22');
      setReels(16);
      setLongVideos(2);
      setGraphics(6);
      setCarousels(4);
      setCustomTargetNote('');
    }
  }, [clientToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please provide client name and email.');
      return;
    }

    onSubmit({
      id: clientToEdit?.id,
      name,
      company: company || name,
      email,
      phone,
      primaryContactName: primaryContactName || name,
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&q=80',
      servicePackage,
      monthlyRetainer: Number(monthlyRetainer),
      currency,
      contractStartDate,
      contractEndDate,
      reels: Number(reels),
      longVideos: Number(longVideos),
      graphics: Number(graphics),
      carousels: Number(carousels),
      customTargetNote,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Edit Client & Deliverable Targets' : 'Add New Client Profile'}
      description="Equal Admin Capability: Configured settings apply agency-wide."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Athletics"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Legal Entity</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Apex Performance Ltd."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@brand.com"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={primaryContactName}
              onChange={(e) => setPrimaryContactName(e.target.value)}
              placeholder="e.g. Arjun Kapoor (CEO)"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98200 00000"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
        </div>

        {/* Package & Financials */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Contract & Service Package
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Service Package
              </label>
              <select
                value={servicePackage}
                onChange={(e) => setServicePackage(e.target.value as ServicePackage)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
              >
                <option value="Full Marketing">Full Marketing</option>
                <option value="Video Editing Only">Video Editing Only</option>
                <option value="Marketing Management Only">Marketing Management Only</option>
                <option value="Custom Retainer">Custom Retainer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Monthly Retainer Amount
              </label>
              <input
                type="number"
                value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contract Start Date
              </label>
              <input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contract End Date
              </label>
              <input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Monthly Deliverable Commitment Targets */}
        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            Monthly Deliverable Commitment Targets
          </span>
          <p className="text-[11px] text-blue-800">
            Set individual deliverable commitments tracked in the Monthly Deliverable Tracker.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reels Target</label>
              <input
                type="number"
                min="0"
                value={reels}
                onChange={(e) => setReels(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Long Videos</label>
              <input
                type="number"
                min="0"
                value={longVideos}
                onChange={(e) => setLongVideos(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Graphics</label>
              <input
                type="number"
                min="0"
                value={graphics}
                onChange={(e) => setGraphics(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Carousels</label>
              <input
                type="number"
                min="0"
                value={carousels}
                onChange={(e) => setCarousels(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg text-slate-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Custom Target / Strategic Note
            </label>
            <input
              type="text"
              value={customTargetNote}
              onChange={(e) => setCustomTargetNote(e.target.value)}
              placeholder="e.g. Focus on athlete hooks and winter collection launch"
              className="w-full text-xs p-2 bg-white border border-blue-200 rounded-lg text-slate-900"
            />
          </div>
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
            {clientToEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
