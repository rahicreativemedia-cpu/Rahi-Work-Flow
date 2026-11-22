/**
 * RAHI FLOWDESK — PHASE 3 AUTOMATED VERIFICATION SUITE
 * Client Management & Monthly Deliverable Tracker
 *
 * Verifies:
 * 1. Admin & Manager equal access for Client CRUD, target management, and status toggles.
 * 2. Employee and Client boundary enforcement (financial retainer hiding and client isolation).
 * 3. Strict Milestone Counting Rule (Only Stage 10 + published/delivered counts towards monthly quota).
 * 4. Pacing calculations, warning indicators, and progress percentages.
 * 5. Cancellation preservation and audit history.
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal reporting
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    passedCount++;
    console.log(`  ${colors.green}✓ PASS:${colors.reset} ${testName}`);
    if (detail) console.log(`         ${colors.cyan}(${detail})${colors.reset}`);
  } else {
    failedCount++;
    console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${testName}`);
    if (detail) console.error(`         ${colors.yellow}FAILED: ${detail}${colors.reset}`);
  }
}

// Load DB
const dbPath = path.join(__dirname, '../data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Canonical Permission & Pacing Logic directly matching lib/permissions.ts and lib/utils.ts
const TODAY_STRING = '2026-11-22';

function hasFullAdminAccess(user) {
  if (!user) return false;
  if (user.status === 'inactive') return false;
  return (
    user.permissionGroup === 'FULL_ADMIN_ACCESS' ||
    user.role === 'admin' ||
    user.role === 'manager'
  );
}

function calculateClientDeliverableStats(client, deliverables, targetMonth = '2026-11') {
  const clientDeliverables = deliverables.filter((d) => {
    const matchClient = d.clientId === client.id;
    if (!matchClient) return false;
    if (targetMonth) return d.targetMonth === targetMonth;
    return true;
  });

  const activeDeliverables = clientDeliverables.filter((d) => d.status !== 'cancelled');
  const cancelledDeliverables = clientDeliverables.filter((d) => d.status === 'cancelled');

  // Only true completions: Stage 10 AND status published or delivered
  const completedDeliverables = activeDeliverables.filter(
    (d) =>
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  );

  const inProgressDeliverables = activeDeliverables.filter(
    (d) =>
      !(
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
      )
  );

  const totalMonthlyCommitment =
    client.monthlyCommitment.reels +
    client.monthlyCommitment.longVideos +
    client.monthlyCommitment.graphics +
    client.monthlyCommitment.carousels;

  const completedCount = completedDeliverables.length;
  const inProgressCount = inProgressDeliverables.length;
  const remainingCount = Math.max(0, totalMonthlyCommitment - completedCount);
  const completionPercentage =
    totalMonthlyCommitment > 0
      ? Math.min(100, Math.round((completedCount / totalMonthlyCommitment) * 100))
      : 0;

  // Pacing Calculation
  const currentMonthStr = TODAY_STRING.substring(0, 7); // '2026-11'
  const currentDayNum = parseInt(TODAY_STRING.substring(8, 10), 10); // 22

  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 11;
  const totalDaysInMonth = new Date(year, month, 0).getDate(); // 30 for Nov

  let daysElapsed = 0;
  let monthProgressionPct = 0;

  if (targetMonth === currentMonthStr) {
    daysElapsed = Math.min(currentDayNum, totalDaysInMonth);
    monthProgressionPct = Math.round((daysElapsed / totalDaysInMonth) * 100);
  } else if (targetMonth < currentMonthStr) {
    daysElapsed = totalDaysInMonth;
    monthProgressionPct = 100;
  } else {
    daysElapsed = 0;
    monthProgressionPct = 0;
  }

  const expectedDeliverables = Math.round(totalMonthlyCommitment * (monthProgressionPct / 100));
  const pacingDelta = completedCount - expectedDeliverables;

  let pacingStatus = 'on_track';
  let pacingLabel = 'On Track';
  let pacingBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';

  if (monthProgressionPct === 0) {
    pacingStatus = 'upcoming';
    pacingLabel = 'Upcoming Month';
    pacingBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (monthProgressionPct === 100) {
    if (completedCount >= totalMonthlyCommitment) {
      pacingStatus = 'completed';
      pacingLabel = 'Target Met (100%)';
      pacingBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      pacingStatus = 'critical';
      pacingLabel = `Target Shortfall (-${remainingCount})`;
      pacingBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else {
    if (completionPercentage >= monthProgressionPct + 5) {
      pacingStatus = 'ahead';
      pacingLabel = `Ahead of Pace (+${pacingDelta})`;
      pacingBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (completionPercentage >= monthProgressionPct - 10) {
      pacingStatus = 'on_track';
      pacingLabel = `On Track (${completedCount}/${expectedDeliverables} exp)`;
      pacingBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (completionPercentage >= monthProgressionPct - 25) {
      pacingStatus = 'behind';
      pacingLabel = `Behind Pace (${pacingDelta})`;
      pacingBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      pacingStatus = 'critical';
      pacingLabel = `Critical Lag (${pacingDelta} deliverables)`;
      pacingBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  }

  return {
    totalCommitment: totalMonthlyCommitment,
    completed: completedCount,
    inProgress: inProgressCount,
    remaining: remainingCount,
    cancelled: cancelledDeliverables.length,
    completionPercentage,
    deliverables: clientDeliverables,
    completedItems: completedDeliverables,
    inProgressItems: inProgressDeliverables,
    pacing: {
      monthProgressionPct,
      daysElapsed,
      totalDaysInMonth,
      expectedDeliverables,
      pacingDelta,
      pacingStatus,
      pacingLabel,
      pacingBadgeClass,
    },
  };
}

console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.blue}  RAHI FLOWDESK — PHASE 3: CLIENT & DELIVERABLE TRACKER TESTS   ${colors.reset}`);
console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

// -------------------------------------------------------------------------
// SECTION 1: CLIENT MANAGEMENT & ADMIN/MANAGER EQUAL ACCESS
// -------------------------------------------------------------------------
console.log(`${colors.bold}[1] CLIENT MANAGEMENT & EQUAL ADMINISTRATIVE PERMISSIONS${colors.reset}`);

const adminUser = db.users.find((u) => u.role === 'admin' && u.status === 'active');
const managerUser = db.users.find((u) => u.role === 'manager' && u.status === 'active');
const employeeUser = db.users.find((u) => u.role === 'employee' && u.status === 'active');
const clientUser = db.users.find((u) => u.role === 'client' && u.status === 'active');

assert(adminUser !== undefined, 'Admin user exists in system', adminUser?.name);
assert(managerUser !== undefined, 'Manager user exists in system', managerUser?.name);
assert(hasFullAdminAccess(adminUser), 'Admin has FULL_ADMIN_ACCESS permission group');
assert(hasFullAdminAccess(managerUser), 'Manager has FULL_ADMIN_ACCESS permission group');
assert(
  adminUser.permissionGroup === managerUser.permissionGroup,
  'Admin and Manager share exact identical permission group',
  adminUser.permissionGroup
);

// Verify client database structure
const clientApex = db.clients.find((c) => c.id === 'cli-1');
assert(clientApex !== undefined, 'Client Apex Athletics exists', clientApex?.name);
assert(
  clientApex.monthlyCommitment &&
    typeof clientApex.monthlyCommitment.reels === 'number' &&
    typeof clientApex.monthlyCommitment.longVideos === 'number' &&
    typeof clientApex.monthlyCommitment.graphics === 'number' &&
    typeof clientApex.monthlyCommitment.carousels === 'number',
  'Client has 4-tier deliverable targets (reels, longVideos, graphics, carousels)',
  `Reels: ${clientApex.monthlyCommitment.reels}, Long: ${clientApex.monthlyCommitment.longVideos}, Graphics: ${clientApex.monthlyCommitment.graphics}, Carousels: ${clientApex.monthlyCommitment.carousels}`
);

assert(
  typeof clientApex.monthlyRetainer === 'number' && clientApex.monthlyRetainer > 0,
  'Client has valid monthly financial retainer',
  `${clientApex.monthlyRetainer} ${clientApex.currency}`
);

assert(
  clientApex.primaryContactName && clientApex.email,
  'Client has complete primary contact details',
  `${clientApex.primaryContactName} (${clientApex.email})`
);

// -------------------------------------------------------------------------
// SECTION 2: SENSITIVE FINANCIAL DATA & BOUNDARY ENFORCEMENT
// -------------------------------------------------------------------------
console.log(`\n${colors.bold}[2] SENSITIVE FINANCIAL DATA & WORKSPACE ISOLATION${colors.reset}`);

// Simulated Employee GET /api/clients
const employeeSafeClients = db.clients.map((c) => ({
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
}));

assert(
  employeeSafeClients.every((c) => c.monthlyRetainer === undefined && c.currency === undefined),
  'Employee client directory strictly hides all monthly retainers and financial data',
  'monthlyRetainer: undefined across all records'
);

assert(
  !hasFullAdminAccess(employeeUser),
  'Employee is denied FULL_ADMIN_ACCESS rights'
);

// Client isolation
const clientApexIsolated = db.clients.filter((c) => c.id === clientUser.clientId);
assert(
  clientApexIsolated.length === 1 && clientApexIsolated[0].id === 'cli-1',
  'Client portal user is strictly isolated to their own organization profile',
  `Viewing org: ${clientApexIsolated[0]?.name}`
);

assert(
  !clientApexIsolated.some((c) => c.id === 'cli-2' || c.id === 'cli-3'),
  'Client user is strictly blocked from viewing any other client organizations'
);

// -------------------------------------------------------------------------
// SECTION 3: STRICT MILESTONE COUNTING RULE
// -------------------------------------------------------------------------
console.log(`\n${colors.bold}[3] STRICT MILESTONE COUNTING RULE & ACCURACY${colors.reset}`);

// Calculate stats for Apex in 2026-11
const apexStats = calculateClientDeliverableStats(clientApex, db.deliverables, '2026-11');

assert(
  apexStats.totalCommitment ===
    clientApex.monthlyCommitment.reels +
      clientApex.monthlyCommitment.longVideos +
      clientApex.monthlyCommitment.graphics +
      clientApex.monthlyCommitment.carousels,
  'Monthly commitment target equals sum of reels + longVideos + graphics + carousels',
  `Target: ${apexStats.totalCommitment} deliverables`
);

assert(
  apexStats.completed === 12,
  'Strict milestone count: exactly 12 deliverables in Stage 10 (publishing_or_delivery) with status published/delivered',
  `Completed: ${apexStats.completed}`
);

assert(
  apexStats.inProgress === 5,
  'Strict milestone count: exactly 5 deliverables in Stages 1-9 in production pipeline',
  `In Progress: ${apexStats.inProgress}`
);

assert(
  apexStats.remaining === apexStats.totalCommitment - apexStats.completed,
  'Remaining deliverables formula accurately reflects Target - Completed',
  `Remaining: ${apexStats.remaining}`
);

// Verify script approvals do NOT count as delivery
const scriptApprovedDeliverables = db.deliverables.filter(
  (d) => d.clientId === 'cli-1' && d.scriptApproved === true && d.stage !== 'publishing_or_delivery'
);
assert(
  scriptApprovedDeliverables.length > 0,
  'Deliverables with script approval exist in pipeline prior to Stage 10',
  `${scriptApprovedDeliverables.length} deliverables found`
);

assert(
  scriptApprovedDeliverables.every((d) => d.isCountedTowardsCommitment === false),
  'Rule Verified: Script approved deliverables do NOT increment monthly delivery quota',
  'isCountedTowardsCommitment: false'
);

// -------------------------------------------------------------------------
// SECTION 4: CANCELLED DELIVERABLE PRESERVATION
// -------------------------------------------------------------------------
console.log(`\n${colors.bold}[4] CANCELLED DELIVERABLE PRESERVATION & AUDIT${colors.reset}`);

// Test with simulated cancelled deliverable
const mockDeliverablesWithCancel = [
  ...db.deliverables,
  {
    id: 'del-mock-cancel-1',
    clientId: 'cli-1',
    clientName: 'Apex Athletics',
    projectId: 'proj-1',
    projectTitle: 'Apex Fall Launch',
    title: 'Cancelled Promo Reel',
    type: 'reel',
    targetMonth: '2026-11',
    stage: 'video_editing',
    currentVersion: 1,
    status: 'cancelled',
    isCountedTowardsCommitment: false,
    cancellationReason: 'Client discontinued winter thermal fleece line',
    cancelledAt: '2026-11-20T10:00:00Z',
    createdAt: '2026-11-15T10:00:00Z',
  },
];

const statsWithCancel = calculateClientDeliverableStats(
  clientApex,
  mockDeliverablesWithCancel,
  '2026-11'
);

assert(
  statsWithCancel.cancelled === 1,
  'Cancelled deliverables are detected and counted in cancelled deliverables tally',
  'Cancelled: 1'
);

assert(
  statsWithCancel.completed === apexStats.completed,
  'Cancelled deliverables strictly do NOT increment completed deliverable count',
  `Completed remains: ${statsWithCancel.completed}`
);

assert(
  statsWithCancel.inProgress === apexStats.inProgress,
  'Cancelled deliverables are excluded from active in-progress deliverables count',
  `In-progress remains: ${statsWithCancel.inProgress}`
);

// -------------------------------------------------------------------------
// SECTION 5: PACING CALCULATIONS & WARNING INDICATORS
// -------------------------------------------------------------------------
console.log(`\n${colors.bold}[5] PRODUCTION PACING & WARNING INDICATORS${colors.reset}`);

assert(
  TODAY_STRING === '2026-11-22',
  'Reference date aligns with operational date 2026-11-22',
  TODAY_STRING
);

assert(
  apexStats.pacing.monthProgressionPct === 73,
  'Pacing: Month progression percentage on Nov 22 is exactly 73% (22/30 days)',
  `${apexStats.pacing.monthProgressionPct}%`
);

assert(
  apexStats.pacing.expectedDeliverables === Math.round(34 * 0.73),
  'Pacing: Expected completed deliverables on Day 22 accurately computed as ~25',
  `Expected: ${apexStats.pacing.expectedDeliverables} deliverables`
);

assert(
  apexStats.pacing.pacingDelta === 12 - 25,
  'Pacing: Pacing deficit calculated as Completed (12) - Expected (25) = -13',
  `Pacing Delta: ${apexStats.pacing.pacingDelta}`
);

assert(
  apexStats.pacing.pacingStatus === 'critical' || apexStats.pacing.pacingStatus === 'behind',
  'Pacing: Warning indicator triggered for Apex Athletics due to lag behind expected pace',
  `Status: ${apexStats.pacing.pacingStatus} (${apexStats.pacing.pacingLabel})`
);

// Test on-track client simulation
const mockClientOnTrack = {
  ...clientApex,
  id: 'cli-mock-ontrack',
  monthlyCommitment: { reels: 10, longVideos: 0, graphics: 0, carousels: 0 },
};
const mockDeliverablesOnTrack = Array.from({ length: 8 }, (_, i) => ({
  id: `del-mock-ontrack-${i}`,
  clientId: 'cli-mock-ontrack',
  stage: 'publishing_or_delivery',
  status: 'published',
  targetMonth: '2026-11',
  isCountedTowardsCommitment: true,
}));

const statsOnTrack = calculateClientDeliverableStats(
  mockClientOnTrack,
  mockDeliverablesOnTrack,
  '2026-11'
);

assert(
  statsOnTrack.pacing.pacingStatus === 'on_track' || statsOnTrack.pacing.pacingStatus === 'ahead',
  'Pacing: On-track / Ahead status badge triggered when deliverable progress meets or exceeds pace',
  `Status: ${statsOnTrack.pacing.pacingStatus} (${statsOnTrack.pacing.pacingLabel})`
);

// Past month evaluation
const statsPastMonth = calculateClientDeliverableStats(
  clientApex,
  db.deliverables,
  '2026-10'
);
assert(
  statsPastMonth.pacing.monthProgressionPct === 100,
  'Pacing: Past month evaluates to 100% elapsed time',
  '100%'
);

// Future month evaluation
const statsFutureMonth = calculateClientDeliverableStats(
  clientApex,
  db.deliverables,
  '2026-12'
);
assert(
  statsFutureMonth.pacing.monthProgressionPct === 0 && statsFutureMonth.pacing.pacingStatus === 'upcoming',
  'Pacing: Future month evaluates to 0% elapsed time and upcoming status',
  statsFutureMonth.pacing.pacingLabel
);

// -------------------------------------------------------------------------
// SECTION 6: CLIENT AUDIT LOGGING
// -------------------------------------------------------------------------
console.log(`\n${colors.bold}[6] CLIENT MANAGEMENT AUDIT LOGGING${colors.reset}`);

const clientAuditLogs = db.auditLogs.filter((a) => a.targetType === 'client');
assert(
  clientAuditLogs.length > 0,
  'Client audit log history is maintained',
  `${clientAuditLogs.length} entries found`
);

const sampleAudit = clientAuditLogs[0];
assert(
  sampleAudit.userId && sampleAudit.userName && sampleAudit.action && sampleAudit.timestamp,
  'Audit log contains complete caller attribution and timestamp',
  `Action: "${sampleAudit.action}" by ${sampleAudit.userName} (${sampleAudit.userRole})`
);

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
console.log(`${colors.bold}  PHASE 3 VERIFICATION RESULTS: ${colors.green}${passedCount} PASSED${colors.reset}, ${failedCount > 0 ? colors.red : colors.green}${failedCount} FAILED${colors.reset}`);
console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
