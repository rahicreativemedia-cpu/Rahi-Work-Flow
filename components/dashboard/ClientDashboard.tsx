import React from 'react';
import { Client, Deliverable, Project, User } from '@/lib/types';
import { calculateClientDeliverableStats, formatDateTime } from '@/lib/utils';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  Award,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface ClientDashboardProps {
  client: Client;
  projects: Project[];
  deliverables: Deliverable[];
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onSelectDeliverable: (deliverable: Deliverable) => void;
}

export function ClientDashboard({
  client,
  projects,
  deliverables,
  currentUser,
  onNavigateTab,
  onSelectDeliverable,
}: ClientDashboardProps) {
  // Calculate delivery stats for this client
  const stats = calculateClientDeliverableStats(client, deliverables, '2026-11');

  // Deliverables pending client review
  const pendingApprovals = deliverables.filter(
    (d) =>
      d.clientId === client.id &&
      (d.stage === 'client_script_approval' ||
        d.stage === 'client_video_approval' ||
        d.status === 'client_review')
  );

  // Scheduled deliverables
  const scheduledDeliverables = deliverables.filter(
    (d) => d.clientId === client.id && (d.stage === 'scheduling' || d.status === 'scheduled')
  );

  // Final published assets available for download
  const publishedAssets = deliverables.filter(
    (d) =>
      d.clientId === client.id &&
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  return (
    <div className="space-y-6">
      {/* Client Welcome Banner */}
      <div className="bg-gradient-to-r from-[#170C12] via-[#24101B] to-[#140810] text-white p-6 rounded-2xl shadow-lg border border-[#3D1A2C] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-950 text-rose-100 border border-rose-800/80">
              CLIENT PRIVATE WORKSPACE
            </span>
            <span className="text-xs text-rose-200/70 font-medium">{client.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
            Welcome, {currentUser.name}
          </h2>
          <p className="text-xs text-rose-100/70 mt-1 max-w-xl leading-relaxed">
            Your private brand hub at RAHI Creative Media. Track your monthly deliverable progress, review scripts and video edits, and access your published master files.
          </p>
        </div>

        <div className="p-3 bg-[#1F101A] rounded-xl border border-[#3D1A2C] text-xs text-rose-200 flex items-center gap-3">
          <Shield className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            Encrypted & Isolated Workspace: Only {client.name} data is visible here.
          </div>
        </div>
      </div>

      {/* Monthly Commitment Big Progress Card (Section 9 Requirement) */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-neutral-900" />
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                Monthly Commitment Progress — November 2026
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Agreed package commitment: {stats.totalCommitment} deliverables ({client.monthlyCommitment.reels} Reels, {client.monthlyCommitment.longVideos} Long Videos, {client.monthlyCommitment.graphics} Graphics).
            </p>
          </div>

          <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-300">
            {stats.completionPercentage}% Delivered
          </span>
        </div>

        {/* 3 Metric Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center my-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-xs font-semibold text-neutral-700">Completed & Delivered</div>
            <div className="text-3xl font-black text-black mt-1">{stats.completed}</div>
            <div className="text-[11px] text-neutral-500 mt-1">Verified Published Deliverables</div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-xs font-semibold text-neutral-700">In Creative Pipeline</div>
            <div className="text-3xl font-black text-black mt-1">{stats.inProgress}</div>
            <div className="text-[11px] text-neutral-500 mt-1">Scripting, Editing & Reviews</div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-xs font-semibold text-neutral-700">Remaining to Target</div>
            <div className="text-3xl font-black text-black mt-1">{stats.remaining}</div>
            <div className="text-[11px] text-neutral-500 mt-1">Scheduled for Month-End</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-black h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Pending Approvals & Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Pending Your Review & Approval
              </h3>
              <Badge variant="slate">{pendingApprovals.length} to review</Badge>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Review scripts or video cuts prepared by RAHI creative team.
            </p>

            <div className="space-y-3">
              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-neutral-600 mx-auto mb-1" />
                  No items waiting for your approval right now.
                </div>
              ) : (
                pendingApprovals.map((del) => (
                  <div
                    key={del.id}
                    onClick={() => onSelectDeliverable(del)}
                    className="p-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">{del.title}</span>
                      <span className="text-[10px] font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded uppercase">
                        {del.stage === 'client_script_approval' ? 'Script' : 'Video Cut'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-1">
                      {del.scriptText || 'Click to preview video asset and approve or request revision.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('approvals')}
            className="w-full mt-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Open Approvals Center
          </button>
        </div>

        {/* Final Assets Ready for Download */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Published & Final Deliverables
              </h3>
              <Badge variant="slate">{publishedAssets.length} assets</Badge>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Download authorized 4K vertical exports and graphic assets.
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {publishedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-neutral-900 truncate">{asset.title}</div>
                    <div className="text-[10px] text-neutral-400 capitalize">
                      {asset.type} • Published on {formatDateTime(asset.publishedAt)}
                    </div>
                  </div>

                  {asset.mediaUrl && (
                    <a
                      href={asset.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded text-neutral-900 font-semibold flex items-center gap-1 text-xs shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('asset_library')}
            className="w-full mt-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors"
          >
            View Complete Asset Library
          </button>
        </div>
      </div>
    </div>
  );
}
