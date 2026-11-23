import {
  getClients,
  getProjects,
  getDeliverables,
  getTasks,
  getEmployees,
} from '@/lib/db';
import { hasFullAdminAccess } from '@/lib/permissions';
import { calculateClientDeliverableStats } from '@/lib/utils';
import { getAuthenticatedUser } from '@/lib/session';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitUserId = searchParams.get('userId');
    const auth = await getAuthenticatedUser(request, explicitUserId);

    if (!auth.user) {
      return privateErrorResponse(
        auth.error ||
          'Unauthorized: Authentication required to access analytics and reports',
        auth.status || 401
      );
    }

    const user = auth.user;

    // Financial and full company reports are restricted to FULL_ADMIN_ACCESS (Admin & Manager)
    if (!hasFullAdminAccess(user)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to view executive reports',
        403
      );
    }

    const [allClients, allProjects, allDeliverables, allTasks, allEmployees] =
      await Promise.all([
        getClients(),
        getProjects(),
        getDeliverables(),
        getTasks(),
        getEmployees(),
      ]);

    const activeClients = allClients.filter((c) => c.status === 'active');
    const activeProjects = allProjects.filter(
      (p) => p.status === 'in_progress' || p.status === 'planning'
    );

    // Overall Deliverables
    const activeDeliverables = allDeliverables.filter((d) => d.status !== 'cancelled');
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
    const overdueTasks = allTasks.filter(
      (t) => t.deadline < today && t.status !== 'completed'
    );

    // Pending Approvals
    const pendingApprovals = allDeliverables.filter(
      (d) => d.status === 'client_review'
    );

    // Client-wise Deliverable Tracker Stats
    const clientStats = allClients.map((client) => {
      const stats = calculateClientDeliverableStats(client, allDeliverables);
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
    const employeeStats = allEmployees.map((emp) => {
      const empTasks = allTasks.filter(
        (t) => t.assignedEmployeeId === emp.id || t.assignedEmployeeId === emp.userId
      );
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
        utilizationRate: Math.round(
          (activeTasks.length / (emp.maxConcurrentTasks || 5)) * 100
        ),
      };
    });

    return privateJsonResponse({
      success: true,
      executiveSummary: {
        totalClients: allClients.length,
        activeClients: activeClients.length,
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        totalDeliverables: activeDeliverables.length,
        completedDeliverables: completedDeliverables.length,
        pendingDeliverables: pendingDeliverables.length,
        overdueTasksCount: overdueTasks.length,
        pendingApprovalsCount: pendingApprovals.length,
      },
      clientDeliverableTracking: clientStats,
      employeeProductivity: employeeStats,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to generate reports', 500, error);
  }
}
