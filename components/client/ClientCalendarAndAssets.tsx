import React from 'react';
import { Deliverable, Client } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { Calendar as CalendarIcon, Download, Video, FileText, CheckCircle2 } from 'lucide-react';

interface ClientCalendarAndAssetsProps {
  client: Client;
  deliverables: Deliverable[];
  mode: 'calendar' | 'asset_library';
  onSelectDeliverable: (deliverable: Deliverable) => void;
}

export function ClientCalendarAndAssets({
  client,
  deliverables,
  mode,
  onSelectDeliverable,
}: ClientCalendarAndAssetsProps) {
  const clientDeliverables = deliverables.filter((d) => d.clientId === client.id);

  if (mode === 'calendar') {
    const scheduledAndPublished = clientDeliverables.filter(
      (d) => d.stage === 'scheduling' || d.status === 'scheduled' || d.status === 'published'
    );

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-rose-800" />
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              {client.name} Content Publishing Calendar
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Scheduled posts, live slots, and final delivery dates for all approved deliverables.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Publishing Schedule</h3>
            <span className="text-xs text-neutral-500">{scheduledAndPublished.length} Scheduled Content Items</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {scheduledAndPublished.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No items currently scheduled. Approving video cuts will automatically slot them into the schedule.
              </div>
            ) : (
              scheduledAndPublished.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectDeliverable(item)}
                  className="p-4 hover:bg-neutral-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">{item.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-900 border border-neutral-300 uppercase">
                        {item.type}
                      </span>
                      {item.status === 'published' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-100 border border-rose-800">
                          Published & Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-300">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Slot Date: {item.scheduledPublishDate ? formatDateTime(item.scheduledPublishDate) : item.deadline}
                    </p>
                  </div>

                  <span className="text-xs text-rose-900 font-semibold hover:text-rose-950 hover:underline">
                    View Details →
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // mode === 'asset_library'
  const publishedAssets = clientDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-rose-800" />
          <h2 className="text-lg font-bold text-stone-900 tracking-tight">
            Authorized Master Deliverables Library
          </h2>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          High-resolution master vertical 4K video exports, caption sheets, and graphic deliverables.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {publishedAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {asset.type}
                </span>
                <span className="text-[11px] text-stone-400">v{asset.currentVersion}</span>
              </div>

              <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{asset.title}</h4>
              <p className="text-xs text-stone-500 mt-1">
                Published on: {formatDateTime(asset.publishedAt || asset.createdAt)}
              </p>

              {asset.mediaUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-stone-200 bg-black aspect-video max-h-40 flex items-center justify-center">
                  <video src={asset.mediaUrl} controls className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-medium">H.264 4K Vertical</span>
              {asset.mediaUrl && (
                <a
                  href={asset.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-gradient-to-r from-rose-900 to-rose-950 hover:brightness-110 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs border border-rose-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Master</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
