import React, { useState, useEffect } from 'react';
import { Client, ServicePackage } from '@/lib/types';
import { TODAY_STRING } from '@/lib/utils';
import { Modal } from '../common/Modal';
import { Eye, EyeOff, Key, RefreshCw } from 'lucide-react';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('client123');
  const [showPassword, setShowPassword] = useState(false);
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
      setUsername((clientToEdit as any).username || clientToEdit.email?.split('@')[0] || '');
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
      setUsername('');
      setPassword('client123');
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

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!clientToEdit && (!username || username === email.split('@')[0])) {
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
      alert('Please provide client name and email.');
      return;
    }

    const finalUsername = (username.trim() || email.split('@')[0]).toLowerCase();

    onSubmit({
      id: clientToEdit?.id,
      name: name.trim(),
      company: (company || name).trim(),
      email: email.trim().toLowerCase(),
      username: finalUsername,
      password: password.trim(),
      phone: phone.trim(),
      primaryContactName: (primaryContactName || name).trim(),
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
            <label className="block text-xs font-bold text-neutral-700 mb-1">Brand Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Athletics"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Company Legal Entity</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Apex Performance Ltd."
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Client Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="contact@brand.com"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={primaryContactName}
              onChange={(e) => setPrimaryContactName(e.target.value)}
              placeholder="e.g. Arjun Kapoor (CEO)"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98200 00000"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Client Portal Credentials - Admin/Manager Sets Email & Password */}
        {!clientToEdit && (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
              <Key className="w-3.5 h-3.5 text-black" />
              <span>Client Portal Login Credentials (Set by Management)</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-tight">
              Directly assign the client representative&apos;s username and portal password. Clients cannot change credentials on their own.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Portal Username / Handle *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. apex.athletics"
                  className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Portal Login Password *
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
                    placeholder="Set client password"
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

        {/* Package & Financials */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Contract & Service Package
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Service Package
              </label>
              <select
                value={servicePackage}
                onChange={(e) => setServicePackage(e.target.value as ServicePackage)}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-medium"
              >
                <option value="Full Marketing">Full Marketing</option>
                <option value="Video Editing Only">Video Editing Only</option>
                <option value="Marketing Management Only">Marketing Management Only</option>
                <option value="Custom Retainer">Custom Retainer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Monthly Retainer Amount
              </label>
              <input
                type="number"
                value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Contract Start Date
              </label>
              <input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Contract End Date
              </label>
              <input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Monthly Deliverable Commitment Targets */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <span className="text-xs font-bold text-black uppercase tracking-wider">
            Monthly Deliverable Commitment Targets
          </span>
          <p className="text-[11px] text-neutral-600">
            Set individual deliverable commitments tracked in the Monthly Deliverable Tracker.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Reels Target</label>
              <input
                type="number"
                min="0"
                value={reels}
                onChange={(e) => setReels(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-black font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Long Videos</label>
              <input
                type="number"
                min="0"
                value={longVideos}
                onChange={(e) => setLongVideos(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-black font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Graphics</label>
              <input
                type="number"
                min="0"
                value={graphics}
                onChange={(e) => setGraphics(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-black font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">Carousels</label>
              <input
                type="number"
                min="0"
                value={carousels}
                onChange={(e) => setCarousels(Number(e.target.value))}
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-black font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-800 mb-1">
              Custom Target / Strategic Note
            </label>
            <input
              type="text"
              value={customTargetNote}
              onChange={(e) => setCustomTargetNote(e.target.value)}
              placeholder="e.g. Focus on athlete hooks and winter collection launch"
              className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-black"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {clientToEdit ? 'Save Changes' : 'Create Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
