import React, { useState, useEffect, useRef } from 'react';
import { Client, ServicePackage } from '@/lib/types';
import { TODAY_STRING } from '@/lib/utils';
import { Modal } from '../common/Modal';
import {
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Upload,
  X,
  Image as ImageIcon,
  Calendar,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';

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
  // A. Client Basic Information
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [contractStartDate, setContractStartDate] = useState(TODAY_STRING);
  const [contractEndDate, setContractEndDate] = useState('2027-11-22');

  // Logo Upload & Management
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Client Portal Credentials (Management Set)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('client123');
  const [showPassword, setShowPassword] = useState(false);

  // B. Service Package
  const [servicePackage, setServicePackage] = useState<ServicePackage>('Full Marketing');

  // Retainer fields preserved silently in state to prevent breaking finance/invoices
  const [monthlyRetainer, setMonthlyRetainer] = useState(200000);
  const [currency, setCurrency] = useState('INR');

  // C. 6 Category Monthly Targets
  const [reels, setReels] = useState(16);
  const [marketingReels, setMarketingReels] = useState(8);
  const [posts, setPosts] = useState(12);
  const [carousels, setCarousels] = useState(4);
  const [showreels, setShowreels] = useState(2);
  const [longVideos, setLongVideos] = useState(2);
  const [customTargetNote, setCustomTargetNote] = useState('');

  // D. Weekly Video Commitment for Video Production Only
  const [enableWeeklyTracking, setEnableWeeklyTracking] = useState(false);
  const [weeklyReels, setWeeklyReels] = useState(4);
  const [weeklyMarketingReels, setWeeklyMarketingReels] = useState(2);
  const [weeklyShowreels, setWeeklyShowreels] = useState(1);
  const [weeklyLongVideos, setWeeklyLongVideos] = useState(1);
  const [weekStartDay, setWeekStartDay] = useState<'Monday' | 'Sunday'>('Monday');
  const [weeklyDeadlineDay, setWeeklyDeadlineDay] = useState<
    'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  >('Friday');

  // Sync state when editing or reopening modal
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
      setStatus(clientToEdit.status === 'inactive' ? 'inactive' : 'active');
      setMonthlyRetainer(clientToEdit.monthlyRetainer ?? 200000);
      setCurrency(clientToEdit.currency || 'INR');
      setContractStartDate(clientToEdit.contractStartDate || TODAY_STRING);
      setContractEndDate(clientToEdit.contractEndDate || '2027-11-22');

      const mc = clientToEdit.monthlyCommitment;
      setReels(mc?.reels ?? 16);
      setMarketingReels(mc?.marketingReels ?? 8);
      setPosts(mc?.posts ?? mc?.graphics ?? 12);
      setCarousels(mc?.carousels ?? 4);
      setShowreels(mc?.showreels ?? 2);
      setLongVideos(mc?.longVideos ?? 2);
      setCustomTargetNote(mc?.customTargetNote || '');

      const isWeekly =
        mc?.trackingFrequency === 'weekly' ||
        clientToEdit.servicePackage === 'Video Production Only';
      setEnableWeeklyTracking(isWeekly);

      if (mc?.weeklyCommitment) {
        setWeeklyReels(mc.weeklyCommitment.reels ?? 4);
        setWeeklyMarketingReels(mc.weeklyCommitment.marketingReels ?? 2);
        setWeeklyShowreels(mc.weeklyCommitment.showreels ?? 1);
        setWeeklyLongVideos(mc.weeklyCommitment.longVideos ?? 1);
        setWeekStartDay(mc.weeklyCommitment.weekStartDay || 'Monday');
        setWeeklyDeadlineDay((mc.weeklyCommitment.deadlineDay || 'Friday') as any);
      } else {
        setWeeklyReels(Math.ceil((mc?.reels ?? 16) / 4));
        setWeeklyMarketingReels(Math.ceil((mc?.marketingReels ?? 8) / 4));
        setWeeklyShowreels(Math.ceil((mc?.showreels ?? 2) / 4));
        setWeeklyLongVideos(Math.ceil((mc?.longVideos ?? 2) / 4));
      }
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
      setStatus('active');
      setMonthlyRetainer(200000);
      setCurrency('INR');
      setContractStartDate(TODAY_STRING);
      setContractEndDate('2027-11-22');

      setReels(16);
      setMarketingReels(8);
      setPosts(12);
      setCarousels(4);
      setShowreels(2);
      setLongVideos(2);
      setCustomTargetNote('');

      setEnableWeeklyTracking(false);
      setWeeklyReels(4);
      setWeeklyMarketingReels(2);
      setWeeklyShowreels(1);
      setWeeklyLongVideos(1);
      setWeekStartDay('Monday');
      setWeeklyDeadlineDay('Friday');
    }
    setLogoUploadError('');
  }, [clientToEdit, isOpen]);

  // When package changes to Video Production Only, suggest weekly tracking
  const handleServicePackageChange = (pkg: ServicePackage) => {
    setServicePackage(pkg);
    if (pkg === 'Video Production Only') {
      setEnableWeeklyTracking(true);
      setPosts(0);
      setCarousels(0);
    }
  };

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

  // Logo File Upload handler (PNG, JPG, WebP <= 2MB)
  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadError('');

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoUploadError('Only PNG, JPG, or WebP image files are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('Logo file size must be under 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/clients/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      setLogoUrl(data.url);
    } catch (err: any) {
      setLogoUploadError(err.message || 'Error uploading file');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setLogoUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please provide client brand name and email.');
      return;
    }

    const finalUsername = (username.trim() || email.split('@')[0]).toLowerCase();

    // Calculate weekly commitment structure if enabled
    const weeklyCommitmentConfig = enableWeeklyTracking
      ? {
          reels: Number(weeklyReels),
          marketingReels: Number(weeklyMarketingReels),
          showreels: Number(weeklyShowreels),
          longVideos: Number(weeklyLongVideos),
          weekStartDay,
          deadlineDay: weeklyDeadlineDay,
        }
      : undefined;

    // Build payload preserving all financial fields in the background
    onSubmit({
      id: clientToEdit?.id,
      name: name.trim(),
      company: (company || name).trim(),
      email: email.trim().toLowerCase(),
      username: finalUsername,
      password: password.trim(),
      phone: phone.trim(),
      primaryContactName: (primaryContactName || name).trim(),
      logoUrl: logoUrl.trim(),
      servicePackage,
      status,
      // Retainer silently preserved for Finance module parity
      monthlyRetainer: Number(monthlyRetainer) || 200000,
      currency: currency || 'INR',
      contractStartDate,
      contractEndDate,
      // 6 Category Targets
      reels: Number(reels),
      marketingReels: Number(marketingReels),
      posts: Number(posts),
      graphics: Number(posts), // Backwards compatibility for graphics
      carousels: Number(carousels),
      showreels: Number(showreels),
      longVideos: Number(longVideos),
      customTargetNote,
      trackingFrequency: enableWeeklyTracking ? 'weekly' : 'monthly',
      weeklyCommitment: weeklyCommitmentConfig,
      weeklyDeadlineDay,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Edit Client & Deliverables' : 'Add New Client Profile'}
      description="Configure client profile, branding, service package, and category deliverable commitments."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1 pr-2">
        {/* SECTION A: CLIENT BASIC INFORMATION */}
        <div className="p-4 bg-neutral-50/70 rounded-xl border border-neutral-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              Client Basic Information
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Radhe Silk"
                className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Radhe Silk Mills Pvt. Ltd."
                className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Primary Contact Name
              </label>
              <input
                type="text"
                value={primaryContactName}
                onChange={(e) => setPrimaryContactName(e.target.value)}
                placeholder="e.g. Rajesh Shah"
                className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Client Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="info@radhesilk.com"
                className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98250 12345"
                className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Client Logo Upload Box */}
          <div className="pt-2 border-t border-neutral-200/60">
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Client Logo (Admin & Manager)
            </label>
            <div className="flex items-center gap-4">
              {/* Logo Preview or Fallback */}
              <div className="w-14 h-14 rounded-xl border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {logoUrl ? (
                  <img src={logoUrl} alt={name || 'Logo'} className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 text-sm">
                    {name ? name.substring(0, 2).toUpperCase() : <ImageIcon className="w-5 h-5 text-neutral-400" />}
                  </div>
                )}
              </div>

              {/* Upload & Action Controls */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoFileSelect}
                    className="hidden"
                    id="client-logo-input"
                  />
                  <label
                    htmlFor="client-logo-input"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 bg-white hover:bg-neutral-50 cursor-pointer shadow-2xs transition-colors ${
                      isUploadingLogo ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">
                  PNG, JPG, WebP up to 2MB. Saved securely for Client Portal and Dashboard.
                </p>
                {logoUploadError && (
                  <p className="text-[11px] text-rose-600 font-medium">{logoUploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Package, Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Service Package *
              </label>
              <select
                value={servicePackage}
                onChange={(e) => handleServicePackageChange(e.target.value as ServicePackage)}
                className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black"
              >
                <option value="Full Marketing">Full Marketing</option>
                <option value="Video Production Only">Video Production Only</option>
                <option value="Video Editing Only">Video Editing Only</option>
                <option value="Marketing Management Only">Marketing Management Only</option>
                <option value="Custom Service Package">Custom Service Package</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Client Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-black"
              >
                <option value="active">Active Client</option>
                <option value="inactive">Inactive Client</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Contract Start Date
              </label>
              <input
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Contract End Date
              </label>
              <input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: CLIENT PORTAL CREDENTIALS (IF CREATING) */}
        {!clientToEdit && (
          <div className="p-3.5 bg-neutral-50/70 rounded-xl border border-neutral-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                <Key className="w-3.5 h-3.5 text-neutral-700" />
                <span>Client Portal Access Credentials</span>
              </div>
              <span className="text-[10px] text-neutral-500">Only Admin & Manager set passwords</span>
            </div>

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
                  placeholder="e.g. radhe.silk"
                  className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Portal Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-neutral-600 hover:text-black flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Generate</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set client password"
                    className="w-full text-xs p-2 pr-8 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: 6 CATEGORY MONTHLY DELIVERABLE TARGETS */}
        <div className="p-4 bg-neutral-50/70 rounded-xl border border-neutral-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-600" />
              Monthly Deliverable Commitment Targets
            </span>
            <span className="text-[11px] text-neutral-500 font-medium">Step 2 of 3</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Set individual monthly targets per category. Targets can be set to 0 to hide that category completely from the client portal.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">Reels</label>
              <input
                type="number"
                min="0"
                value={reels}
                onChange={(e) => setReels(Number(e.target.value))}
                className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
              />
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                Marketing Reels
              </label>
              <input
                type="number"
                min="0"
                value={marketingReels}
                onChange={(e) => setMarketingReels(Number(e.target.value))}
                className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
              />
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">Posts</label>
              <input
                type="number"
                min="0"
                value={posts}
                onChange={(e) => setPosts(Number(e.target.value))}
                className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
              />
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">Carousels</label>
              <input
                type="number"
                min="0"
                value={carousels}
                onChange={(e) => setCarousels(Number(e.target.value))}
                className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
              />
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">Showreels</label>
              <input
                type="number"
                min="0"
                value={showreels}
                onChange={(e) => setShowreels(Number(e.target.value))}
                className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
              />
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">Long Videos</label>
              <input
                type="number"
                min="0"
                value={longVideos}
                onChange={(e) => setLongVideos(Number(e.target.value))}
                className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Custom Target / Strategic Note
            </label>
            <input
              type="text"
              value={customTargetNote}
              onChange={(e) => setCustomTargetNote(e.target.value)}
              placeholder="e.g. Focus on festive wedding reel series and weekly brand awareness"
              className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900"
            />
          </div>
        </div>

        {/* SECTION D: WEEKLY VIDEO COMMITMENT CONFIGURATION */}
        {(servicePackage === 'Video Production Only' || enableWeeklyTracking) && (
          <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                Weekly Video Commitment & Deadlines (Video Production)
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={enableWeeklyTracking}
                  onChange={(e) => setEnableWeeklyTracking(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Enable Weekly Tracking</span>
              </label>
            </div>

            {enableWeeklyTracking && (
              <>
                <p className="text-[11px] text-neutral-600">
                  Configure weekly video quotas and regular weekly submission deadline day.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Weekly Reels
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={weeklyReels}
                      onChange={(e) => setWeeklyReels(Number(e.target.value))}
                      className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Weekly Mkt Reels
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={weeklyMarketingReels}
                      onChange={(e) => setWeeklyMarketingReels(Number(e.target.value))}
                      className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Weekly Showreels
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={weeklyShowreels}
                      onChange={(e) => setWeeklyShowreels(Number(e.target.value))}
                      className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Weekly Long Videos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={weeklyLongVideos}
                      onChange={(e) => setWeeklyLongVideos(Number(e.target.value))}
                      className="w-full text-sm font-bold p-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Week Start Day
                    </label>
                    <select
                      value={weekStartDay}
                      onChange={(e) => setWeekStartDay(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-medium"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Weekly Delivery Deadline Day
                    </label>
                    <select
                      value={weeklyDeadlineDay}
                      onChange={(e) => setWeeklyDeadlineDay(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 font-medium"
                    >
                      <option value="Friday">Friday (Recommended)</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] bg-white p-2.5 rounded-lg border border-rose-200/70 text-rose-900 flex items-center justify-between">
                  <span>
                    Weekly Total:{' '}
                    <strong>
                      {weeklyReels + weeklyMarketingReels + weeklyShowreels + weeklyLongVideos} videos/week
                    </strong>
                  </span>
                  <span>
                    Monthly Expected:{' '}
                    <strong>
                      {(weeklyReels + weeklyMarketingReels + weeklyShowreels + weeklyLongVideos) * 4}{' '}
                      videos/month
                    </strong>
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {clientToEdit ? 'Save Changes' : 'Create Client Profile'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
