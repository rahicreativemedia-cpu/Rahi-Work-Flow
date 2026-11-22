import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { hasFullAdminAccess } from '@/lib/permissions';
import { calculateClientDeliverableStats } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  const user = db.users.find((u) => u.id === userId);

  // Financial and full company reports are restricted to FULL_ADMIN_ACCESS (Admin & Manager)
  if (!hasFullAdminAccess(user)) {
    return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
  }

  const activeClients = db.clients.filter((c) => c.status === 'active');
  const activeProjects = db.projects.filter((p) => p.status === 'in_progress');

  // Overall Deliverables
  const activeDeliverables = db.deliverables.filter((d) => d.status !== 'cancelled');
  const completedDeliverables = activeDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );
  const pendingDeliverables = activeDeliverables.filter(
    (d) =>
      !(
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
      )
  );

  // Overdue Tasks
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = db.tasks.filter(
    (t) => t.deadline < today && t.status !== 'completed'
  );

  // Pending Approvals
  const pendingApprovals = db.deliverables.filter(
    (d) => d.status === 'client_review'
  );

  // Client-wise Deliverable Tracker Stats
  const clientStats = db.clients.map((client) => {
    const stats = calculateClientDeliverableStats(client, db.deliverables);
    return {
      clientId: client.id,
      clientName: client.name,
      company: client.company,
      servicePackage: client.servicePackage,
      monthlyRetainer: client.monthlyRetainer,
      currency: client.currency,
      commitment: client.monthlyCommitment,
      totalCommitment: stats.totalCommitment,
      completed: stats.completed,
      inProgress: stats.inProgress,
      remaining: stats.remaining,
      cancelled: stats.cancelled,
      completionPercentage: stats.completionPercentage,
    };
  });

  // Employee Productivity & Workloads
  const employeeStats = db.employees.map((emp) => {
    const empTasks = db.tasks.filter((t) => t.assignedEmployeeId === emp.id);
    const completedTasks = empTasks.filter((t) => t.status === 'completed');
    const activeTasks = empTasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'backlog'
    );
    const overdueCount = empTasks.filter(
      (t) => t.deadline < today && t.status !== 'completed'
    ).length;

    return {
      employeeId: emp.id,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      activeTasks: activeTasks.length,
      maxTasks: emp.maxConcurrentTasks,
      completedTasks: completedTasks.length,
      overdueCount,
      performanceScore: emp.performanceScore,
      utilizationRate: Math.round((activeTasks.length / emp.maxConcurrentTasks) * 100),
    };
  });

  // Financial Retainers Summary
  const totalMonthlyRetainer = db.clients.reduce(
    (acc, curr) => (curr.status === 'active' ? acc + curr.monthlyRetainer : acc),
    0
  );

  // Creative Pipeline Stage Distribution (10 Stages!)
  const stageDistribution = {
    content_planning: db.deliverables.filter((d) => d.stage === 'content_planning').length,
    scriptwriting: db.deliverables.filter((d) => d.stage === 'scriptwriting').length,
    internal_script_review: db.deliverables.filter((d) => d.stage === 'internal_script_review').length,
    client_script_approval: db.deliverables.filter((d) => d.stage === 'client_script_approval').length,
    video_editing: db.deliverables.filter((d) => d.stage === 'video_editing').length,
    internal_video_review: db.deliverables.filter((d) => d.stage === 'internal_video_review').length,
    client_video_approval: db.deliverables.filter((d) => d.stage === 'client_video_approval').length,
    revisions: db.deliverables.filter((d) => d.stage === 'revisions').length,
    scheduling: db.deliverables.filter((d) => d.stage === 'scheduling').length,
    publishing_or_delivery: db.deliverables.filter((d) => d.stage === 'publishing_or_delivery').length,
  };

  return NextResponse.json({
    summary: {
      totalClients: db.clients.length,
      activeClients: activeClients.length,
      totalEmployees: db.employees.length,
      activeProjects: activeProjects.length,
      totalDeliverables: db.deliverables.length,
      completedDeliverables: completedDeliverables.length,
      pendingDeliverables: pendingDeliverables.length,
      overdueTasksCount: overdueTasks.length,
      pendingApprovalsCount: pendingApprovals.length,
      totalMonthlyRetainer,
    },
    clientStats,
    employeeStats,
    stageDistribution,
    overdueTasks,
    pendingApprovals,
  });
}
