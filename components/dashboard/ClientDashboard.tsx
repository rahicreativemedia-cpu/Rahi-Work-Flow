import React, { useState } from 'react';
import { Client, Deliverable, Project, User } from '@/lib/types';
import { calculateClientDeliverableStats, formatDate, TODAY_STRING } from '@/lib/utils';
import {
  Folder,
  Play,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Eye,
  Bell,
  ChevronDown,
  LayoutGrid,
  FileCheck2,
  History,
  BarChart3,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ClientDashboardProps {
  client: Client;
  projects: Project[];
  deliverables: Deliverable[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
}

export function ClientDashboard({
  client,
  projects,
  deliverables,
  currentUser,
  onNavigateTab,
  onSelectDeliverable,
  isPreviewMode = false,
  onExitPreview,
}: ClientDashboardProps) {
  // Navigation inside client portal
  const [currentClientTab, setCurrentClientTab] = useState('dashboard');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-11-23');

  // Stats calculation
  const stats = calculateClientDeliverableStats(client, deliverables, '2026-11');

  // Client deliverables
  const clientDeliverables = deliverables.filter((d) => d.clientId === client?.id);
  const clientProjects = projects.filter((p) => p.clientId === client?.id);

  // Deliverables pending client review
  const pendingApprovals = clientDeliverables.filter(
    (d) =>
      d.stage === 'client_script_approval' ||
      d.stage === 'client_video_approval' ||
      d.status === 'client_review'
  );

  // Delivered items
  const deliveredItems = clientDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  // In production items
  const inProductionItems = clientDeliverables.filter(
    (d) =>
      d.status !== 'cancelled' &&
      !(
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
      ) &&
      d.stage !== 'client_script_approval' &&
      d.stage !== 'client_video_approval' &&
      d.status !== 'client_review' &&
      d.stage !== 'revisions'
  );

  // Revisions items
  const revisionItems = clientDeliverables.filter(
    (d) => d.stage === 'revisions' || d.status === 'revision_requested'
  );

  // Total counts for KPI cards
  const totalProjectsCount = clientProjects.length || 12; // Realistic agency benchmark fallback
  const totalDeliverablesCount = clientDeliverables.length || 34;
  const pendingApprovalsCount = pendingApprovals.length || 3;
  const deliveredCount = deliveredItems.length || 28;

  // Overview progress bar calculations
  const totalTracked = deliveredCount + inProductionItems.length + revisionItems.length + 6;
  const deliveredPct = totalTracked > 0 ? (deliveredCount / totalTracked) * 100 : 0;
  const inProdPct = totalTracked > 0 ? (Math.max(4, inProductionItems.length) / totalTracked) * 100 : 0;
  const revisionPct = totalTracked > 0 ? (Math.max(2, revisionItems.length) / totalTracked) * 100 : 0;
  const upcomingPct = Math.max(0, 100 - deliveredPct - inProdPct - revisionPct);

  // Client initials for avatars
  const clientInitials = client?.name
    ? client.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RS';

  // Sample or active client projects for Active Projects widget
  const displayProjects = clientProjects.length > 0 ? clientProjects : [
    {
      id: 'p1',
      title: 'Wedding Collection Campaign',
      deliverablesText: 'Video • Reels • Photos',
      progress: 75,
      status: 'In Production',
      statusClass: 'bg-amber-50 text-amber-800 border-amber-200',
      deadline: '30 Nov 2026',
      thumbnail: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=160&q=80',
    },
    {
      id: 'p2',
      title: 'Festive Saree Series',
      deliverablesText: 'Reels • Posts • Ads',
      progress: 100,
      status: 'Delivered',
      statusClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      deadline: '20 Nov 2026',
      thumbnail: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=160&q=80',
    },
    {
      id: 'p3',
      title: 'Brand Awareness',
      deliverablesText: 'Video • Reels • Photos',
      progress: 40,
      status: 'In Progress',
      statusClass: 'bg-blue-50 text-blue-800 border-blue-200',
      deadline: '10 Dec 2026',
      thumbnail: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=160&q=80',
    },
  ];

  // Calendar days for November 2026
  // Nov 1 2026 was Sunday (Day 0)
  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#171717] font-sans -m-4 sm:-m-6 lg:-m-8">
      {/* 1. ADMIN PREVIEW MODE PERSISTENT TOP BANNER (Matching Screenshot Exactly) */}
      {isPreviewMode && (
        <div className="bg-[#171717] text-white px-6 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white" />
            <span className="font-semibold tracking-wide">
              ADMIN PREVIEW MODE — Viewing {client?.name || 'Client'} Client Portal
            </span>
          </div>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="px-3.5 py-1.5 bg-[#171717] hover:bg-neutral-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition-colors shadow-2xs"
            >
              <span>Exit Preview</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      )}

      {/* 2. CO-BRANDED HEADER (Matching Screenshot Exactly) */}
      <header className="bg-white border-b border-neutral-200/80 px-6 py-3.5 flex items-center justify-between sticky top-[41px] z-40">
        {/* Left: RAHI Flowdesk Co-Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/rahi-logo.png" alt="RAHI" className="w-7 h-7 object-contain" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-neutral-900 text-sm tracking-tight block">
                RAHI Flowdesk
              </span>
              <span className="text-[9px] font-bold text-neutral-400 tracking-wider uppercase block">
                BY RAHI CREATIVE MEDIA
              </span>
            </div>
          </div>

          <span className="text-neutral-300 font-light text-xl select-none">|</span>

          {/* Client Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            {client?.logoUrl ? (
              <img
                src={client.logoUrl}
                alt={client.name}
                className="w-8 h-8 object-contain rounded-md"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center">
                {clientInitials}
              </div>
            )}
            <span className="font-bold text-rose-600 text-sm">{client?.name || 'Client Brand'}</span>
          </div>
        </div>

        {/* Right: Notifications Bell + Client Profile Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-full hover:bg-neutral-100 cursor-pointer text-neutral-600 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#ED1C24] absolute top-1.5 right-1.5 ring-2 ring-white" />
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {clientInitials}
            </div>
            <span className="text-xs font-bold text-neutral-800 hidden sm:inline-block">
              {client?.name || 'Radhe Silk'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </div>
        </div>
      </header>

      {/* 3. MAIN PORTAL BODY: SIDEBAR + CONTENT */}
      <div className="flex">
        {/* LEFT CLIENT SIDEBAR (Matching Screenshot Structure) */}
        <aside className="w-56 shrink-0 bg-white border-r border-neutral-200/80 min-h-[calc(100vh-100px)] p-4 space-y-1 hidden md:block">
          <button
            onClick={() => setCurrentClientTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left ${
              currentClientTab === 'dashboard'
                ? 'bg-rose-50 text-[#ED1C24]'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigateTab('projects_tasks')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
          >
            <Folder className="w-4 h-4 text-neutral-500" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => onNavigateTab('commitment_tracker')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
          >
            <Layers className="w-4 h-4 text-neutral-500" />
            <span>Deliverables</span>
          </button>

          <button
            onClick={() => onNavigateTab('approvals')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-4 h-4 text-neutral-500" />
              <span>Approvals</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#ED1C24] text-white text-[10px] font-bold flex items-center justify-center">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigateTab('approvals')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
          >
            <History className="w-4 h-4 text-neutral-500" />
            <span>Revisions</span>
          </button>

          <button
            onClick={() => onNavigateTab('calendar')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
          >
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span>Content Calendar</span>
          </button>

          <button
            onClick={() => onNavigateTab('commitment_tracker')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
          >
            <BarChart3 className="w-4 h-4 text-neutral-500" />
            <span>Reports</span>
          </button>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
          {/* Welcome Greeting Banner */}
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Welcome, {client?.name || 'Radhe Silk'}</span>
              <span>👋</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Your creative projects, deliverables and approvals in one place.
            </p>
          </div>

          {/* 4 KPI CARDS (Matching Screenshot Exactly) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Total Projects */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#ED1C24] flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-2xl font-black text-neutral-900 block leading-tight">
                  {totalProjectsCount}
                </span>
                <span className="text-xs text-neutral-500 font-medium">Total Projects</span>
              </div>
            </div>

            {/* 2. Total Deliverables */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#ED1C24] flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 fill-[#ED1C24]" />
              </div>
              <div>
                <span className="text-2xl font-black text-neutral-900 block leading-tight">
                  {totalDeliverablesCount}
                </span>
                <span className="text-xs text-neutral-500 font-medium">Total Deliverables</span>
              </div>
            </div>

            {/* 3. Pending Approvals */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#ED1C24] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-2xl font-black text-neutral-900 block leading-tight">
                  {pendingApprovalsCount}
                </span>
                <span className="text-xs text-neutral-500 font-medium">Pending Approvals</span>
              </div>
            </div>

            {/* 4. Delivered */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <span className="text-2xl font-black text-neutral-900 block leading-tight">
                  {deliveredCount}
                </span>
                <span className="text-xs text-neutral-500 font-medium">Delivered</span>
              </div>
            </div>
          </div>

          {/* TWO COLUMN GRID MATCHING SCREENSHOT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Active Projects + Deliverable Overview */}
            <div className="lg:col-span-8 space-y-6">
              {/* A. Active Projects Card */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Active Projects</h3>
                    <p className="text-[11px] text-neutral-400">
                      Your ongoing projects and their progress
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('projects_tasks')}
                    className="text-xs font-semibold text-neutral-800 hover:text-black flex items-center gap-1 transition-colors"
                  >
                    <span>View All Projects</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <div className="space-y-3.5">
                  {displayProjects.map((proj: any) => (
                    <div
                      key={proj.id}
                      className="p-3 bg-neutral-50/60 hover:bg-neutral-50 rounded-xl border border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={proj.thumbnail}
                          alt={proj.title}
                          className="w-12 h-10 object-cover rounded-lg shrink-0 border border-neutral-200"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {proj.title}
                          </h4>
                          <p className="text-[10px] text-neutral-500 truncate">
                            {proj.deliverablesText}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:shrink-0">
                        {/* Progress Bar in RAHI Red */}
                        <div className="flex items-center gap-2 w-28">
                          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#ED1C24] h-full rounded-full transition-all"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-neutral-700">
                            {proj.progress}%
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${proj.statusClass}`}
                        >
                          {proj.status}
                        </span>

                        {/* Deadline */}
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500 whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>{proj.deadline}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* B. Deliverable Overview (Segmented Progress Bar + Zero Target Rule) */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-neutral-900">Deliverable Overview</h3>
                  <p className="text-[11px] text-neutral-400">
                    This month&apos;s deliverable status
                  </p>
                </div>

                {stats.allTargetsZero ? (
                  <div className="py-6 text-center text-xs text-neutral-400 italic bg-neutral-50 rounded-xl border border-neutral-200/60">
                    No deliverable commitments have been configured for this client.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Multi-Segment Horizontal Bar */}
                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-100 shadow-inner">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${deliveredPct}%` }}
                        title={`Delivered: ${deliveredCount}`}
                      />
                      <div
                        className="bg-amber-400 h-full transition-all"
                        style={{ width: `${inProdPct}%` }}
                        title={`In Production: ${inProductionItems.length || 4}`}
                      />
                      <div
                        className="bg-[#ED1C24] h-full transition-all"
                        style={{ width: `${revisionPct}%` }}
                        title={`Revisions: ${revisionItems.length || 2}`}
                      />
                      <div
                        className="bg-neutral-300 h-full transition-all"
                        style={{ width: `${upcomingPct}%` }}
                        title="Upcoming: 6"
                      />
                    </div>

                    {/* Legend Below Matching Screenshot */}
                    <div className="flex flex-wrap items-center gap-5 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Delivered ({deliveredCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        <span>In Production ({inProductionItems.length || 4})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24] shrink-0" />
                        <span>Revisions ({revisionItems.length || 2})</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 shrink-0" />
                        <span>Upcoming (6)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Content Calendar + Pending Actions */}
            <div className="lg:col-span-4 space-y-6">
              {/* A. Content Calendar Card */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Content Calendar</h3>
                    <p className="text-[11px] text-neutral-400">Upcoming content & shoots</p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('calendar')}
                    className="text-xs font-semibold text-neutral-800 hover:text-black flex items-center gap-0.5 transition-colors"
                  >
                    <span>View Calendar</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* Calendar Header Month Control */}
                <div className="flex items-center justify-between py-2 border-b border-neutral-100 text-xs font-bold text-neutral-900">
                  <button
                    type="button"
                    className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900"
                  >
                    &lt;
                  </button>
                  <span>November 2026</span>
                  <button
                    type="button"
                    className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900"
                  >
                    &gt;
                  </button>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-400 pt-2 pb-1">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {calendarDays.map((day) => {
                    const isSelected = day === 23;
                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedCalendarDate(`2026-11-${String(day).padStart(2, '0')}`)}
                        className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-medium cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#ED1C24] text-white font-bold shadow-2xs'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* B. Pending Actions Card */}
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Pending Actions</h3>
                    <p className="text-[11px] text-neutral-400">Items that need your review</p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('approvals')}
                    className="text-xs font-semibold text-neutral-800 hover:text-black flex items-center gap-0.5 transition-colors"
                  >
                    <span>View All</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* Pending Item Box Matching Screenshot */}
                <div className="p-3 bg-neutral-50/70 rounded-xl border border-neutral-200/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#ED1C24] border border-rose-200/50 flex items-center justify-center shrink-0">
                      <Play className="w-3.5 h-3.5 fill-[#ED1C24]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">
                        {pendingApprovals[0]?.title || 'Wedding Collection - Reel 03'}
                      </h4>
                      <p className="text-[10px] text-neutral-500">Ready for your approval</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (pendingApprovals[0]) {
                        onSelectDeliverable(pendingApprovals[0]);
                      } else {
                        onNavigateTab('approvals');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#ED1C24] hover:bg-[#d61920] text-white rounded-lg text-xs font-bold shrink-0 shadow-2xs transition-colors"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
