import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Client, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  const user = db.users.find((u) => u.id === userId);

  // If client user, strictly isolate to their own client data
  if (user && user.role === 'client') {
    const client = db.clients.filter((c) => c.id === user.clientId);
    return NextResponse.json({ clients: client });
  }

  // Admin and Manager see all clients with complete financial and target data
  if (hasFullAdminAccess(user)) {
    return NextResponse.json({ clients: db.clients });
  }

  // Employee can see client directory and targets, but financial retainers are strictly hidden
  if (user && user.role === 'employee') {
    const safeClients = db.clients.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      logoUrl: c.logoUrl,
      servicePackage: c.servicePackage,
      status: c.status,
      primaryContactName: c.primaryContactName,
      contractStartDate: c.contractStartDate,
      contractEndDate: c.contractEndDate,
      monthlyCommitment: c.monthlyCommitment,
      createdAt: c.createdAt,
    }));
    return NextResponse.json({ clients: safeClients });
  }

  // Unauthenticated or unrecognized callers: sanitized public directory only
  const safeClients = db.clients.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    logoUrl: c.logoUrl,
    servicePackage: c.servicePackage,
    status: c.status,
  }));
  return NextResponse.json({ clients: safeClients });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, ...clientData } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Manager permission required to manage clients' },
        { status: 403 }
      );
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: clientData.name,
      company: clientData.company || clientData.name,
      email: clientData.email,
      phone: clientData.phone || '',
      logoUrl: clientData.logoUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&q=80',
      servicePackage: clientData.servicePackage || 'Full Marketing',
      contractStartDate: clientData.contractStartDate || new Date().toISOString().split('T')[0],
      contractEndDate: clientData.contractEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyRetainer: Number(clientData.monthlyRetainer) || 150000,
      currency: clientData.currency || 'INR',
      monthlyCommitment: {
        reels: Number(clientData.reels ?? clientData.monthlyCommitment?.reels ?? 15),
        longVideos: Number(clientData.longVideos ?? clientData.monthlyCommitment?.longVideos ?? 2),
        graphics: Number(clientData.graphics ?? clientData.monthlyCommitment?.graphics ?? 6),
        carousels: Number(clientData.carousels ?? clientData.monthlyCommitment?.carousels ?? 4),
        customTargetNote: clientData.customTargetNote ?? clientData.monthlyCommitment?.customTargetNote ?? '',
      },
      status: clientData.status || 'active',
      primaryContactName: clientData.primaryContactName || clientData.name,
      notes: clientData.notes || '',
      createdAt: new Date().toISOString(),
    };

    db.clients.unshift(newClient);

    // Audit log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: caller?.id || 'sys',
      userName: caller?.name || 'Administrator',
      userRole: caller?.role || 'admin',
      action: 'Client Added',
      details: `Added new client "${newClient.name}" with package ${newClient.servicePackage} (${newClient.monthlyRetainer} ${newClient.currency}/mo)`,
      targetType: 'client',
      targetId: newClient.id,
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.unshift(audit);

    saveDB(db);
    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, id, ...updates } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
    }

    const index = db.clients.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const existing = db.clients[index];
    const newMonthlyCommitment = {
      reels: updates.reels !== undefined ? Number(updates.reels) : (updates.monthlyCommitment?.reels ?? existing.monthlyCommitment.reels),
      longVideos: updates.longVideos !== undefined ? Number(updates.longVideos) : (updates.monthlyCommitment?.longVideos ?? existing.monthlyCommitment.longVideos),
      graphics: updates.graphics !== undefined ? Number(updates.graphics) : (updates.monthlyCommitment?.graphics ?? existing.monthlyCommitment.graphics),
      carousels: updates.carousels !== undefined ? Number(updates.carousels) : (updates.monthlyCommitment?.carousels ?? existing.monthlyCommitment.carousels),
      customTargetNote: updates.customTargetNote !== undefined ? updates.customTargetNote : (updates.monthlyCommitment?.customTargetNote ?? existing.monthlyCommitment.customTargetNote),
    };

    const updated: Client = {
      ...existing,
      name: updates.name !== undefined ? updates.name : existing.name,
      company: updates.company !== undefined ? updates.company : existing.company,
      email: updates.email !== undefined ? updates.email : existing.email,
      phone: updates.phone !== undefined ? updates.phone : existing.phone,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : existing.logoUrl,
      servicePackage: updates.servicePackage !== undefined ? updates.servicePackage : existing.servicePackage,
      contractStartDate: updates.contractStartDate !== undefined ? updates.contractStartDate : existing.contractStartDate,
      contractEndDate: updates.contractEndDate !== undefined ? updates.contractEndDate : existing.contractEndDate,
      monthlyRetainer: updates.monthlyRetainer !== undefined ? Number(updates.monthlyRetainer) : existing.monthlyRetainer,
      currency: updates.currency !== undefined ? updates.currency : existing.currency,
      status: updates.status !== undefined ? updates.status : existing.status,
      primaryContactName: updates.primaryContactName !== undefined ? updates.primaryContactName : existing.primaryContactName,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      monthlyCommitment: newMonthlyCommitment,
    };

    db.clients[index] = updated;

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller?.id || 'sys',
      userName: caller?.name || 'Administrator',
      userRole: caller?.role || 'admin',
      action: 'Client Updated',
      details: `Updated client "${updated.name}" (Status: ${updated.status}, Retainer: ${updated.monthlyRetainer} ${updated.currency}/mo)`,
      targetType: 'client',
      targetId: updated.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
  }
}
