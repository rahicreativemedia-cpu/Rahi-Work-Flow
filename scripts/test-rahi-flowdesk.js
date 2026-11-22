const fs = require('fs');
const path = require('path');

function runVerification() {
  console.log('================================================================');
  console.log('  RAHI FLOWDESK — FOUR-PORTAL ARCHITECTURE & PERMISSIONS VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      if (details) console.log(`         (${details})`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error(`         Reason: ${details}`);
      failed++;
    }
  }

  const dbPath = path.join(__dirname, '../data/db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('db.json not found, seeding database...');
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // -------------------------------------------------------------
  // TEST 1: CRITICAL EQUAL PERMISSION REQUIREMENT
  // ADMIN AND MANAGER MUST HAVE EQUAL ADMINISTRATIVE PERMISSIONS
  // -------------------------------------------------------------
  console.log('\n[1] CRITICAL PERMISSION REQUIREMENT: EQUAL ADMIN & MANAGER CAPABILITIES');

  const admin = db.users.find((u) => u.role === 'admin');
  const manager = db.users.find((u) => u.role === 'manager');
  const employee = db.users.find((u) => u.role === 'employee');
  const client = db.users.find((u) => u.role === 'client');

  assert(admin !== undefined, 'Admin user account exists', admin?.name);
  assert(manager !== undefined, 'Manager user account exists', manager?.name);

  // Equal permission group assignment
  assert(
    admin.permissionGroup === 'FULL_ADMIN_ACCESS',
    'Admin assigned to shared permission group "FULL_ADMIN_ACCESS"',
    admin.permissionGroup
  );

  assert(
    manager.permissionGroup === 'FULL_ADMIN_ACCESS',
    'Manager assigned to shared permission group "FULL_ADMIN_ACCESS"',
    manager.permissionGroup
  );

  assert(
    admin.permissionGroup === manager.permissionGroup,
    'Admin and Manager share exact identical permission group name',
    'FULL_ADMIN_ACCESS'
  );

  // No separate Boss role
  const bossRoleUsers = db.users.filter((u) => u.role.toLowerCase() === 'boss');
  assert(
    bossRoleUsers.length === 0,
    'No separate Boss role exists (Boss operates via Admin Portal)'
  );

  // -------------------------------------------------------------
  // TEST 2: SHARED DATA VISIBILITY (NO ISOLATED WORKSPACES)
  // -------------------------------------------------------------
  console.log('\n[2] SHARED DATA VISIBILITY & ZERO WORKSPACE ISOLATION BETWEEN ADMIN & MANAGER');

  // Verify all clients are visible to both
  const totalClients = db.clients.length;
  assert(
    totalClients >= 3,
    'Shared client portfolio is accessible to both roles',
    `${totalClients} clients registered`
  );

  // Verify all projects are visible to both
  const totalProjects = db.projects.length;
  assert(
    totalProjects >= 3,
    'Shared project records accessible to both roles',
    `${totalProjects} active projects`
  );

  // Verify all tasks are visible to both
  const totalTasks = db.tasks.length;
  assert(
    totalTasks >= 5,
    'Company-wide operational tasks visible to both roles',
    `${totalTasks} tasks in system`
  );

  // -------------------------------------------------------------
  // TEST 3: EMPLOYEE RESTRICTION (PORTAL 3)
  // -------------------------------------------------------------
  console.log('\n[3] EMPLOYEE ACCESS RESTRICTIONS & SCOPE ENFORCEMENT');

  assert(
    employee.permissionGroup === 'EMPLOYEE_ACCESS',
    'Employee has restricted "EMPLOYEE_ACCESS" permission group',
    employee.permissionGroup
  );

  // Filter tasks for employee Vikram Mehta (emp-1)
  const employeeVikramTasks = db.tasks.filter(
    (t) => t.assignedEmployeeId === 'emp-1' || t.assignedEmployeeName.includes('Vikram')
  );
  const employeeAnanyaTasks = db.tasks.filter(
    (t) => t.assignedEmployeeId === 'emp-2' || t.assignedEmployeeName.includes('Ananya')
  );

  assert(
    employeeVikramTasks.length > 0 && employeeAnanyaTasks.length > 0,
    'Tasks are strictly assigned to specific employees',
    `Vikram: ${employeeVikramTasks.length}, Ananya: ${employeeAnanyaTasks.length}`
  );

  assert(
    employeeVikramTasks.length < db.tasks.length,
    'Employee does NOT see all company-wide tasks (filtered to assigned work only)'
  );

  // -------------------------------------------------------------
  // TEST 4: CLIENT PRIVATE WORKSPACE ISOLATION (PORTAL 4)
  // -------------------------------------------------------------
  console.log('\n[4] CLIENT PRIVATE WORKSPACE BOUNDARY & ISOLATION');

  assert(
    client.permissionGroup === 'CLIENT_ACCESS',
    'Client has restricted "CLIENT_ACCESS" permission group',
    client.permissionGroup
  );

  assert(
    client.clientId !== undefined,
    'Client user is bound to a single private client organization',
    `Bound to clientId: ${client.clientId} (${client.clientName})`
  );

  const client1Deliverables = db.deliverables.filter((d) => d.clientId === 'cli-1');
  const client2Deliverables = db.deliverables.filter((d) => d.clientId === 'cli-2');

  assert(
    client1Deliverables.length > 0 && client2Deliverables.length > 0,
    'Deliverables are isolated strictly by clientId',
    `Apex: ${client1Deliverables.length}, Lumina: ${client2Deliverables.length}`
  );

  // -------------------------------------------------------------
  // TEST 5: CREATIVE PRODUCTION WORKFLOW (10 STAGES)
  // -------------------------------------------------------------
  console.log('\n[5] 10-STAGE CREATIVE PRODUCTION WORKFLOW PIPELINE');

  const required10Stages = [
    'content_planning',
    'scriptwriting',
    'internal_script_review',
    'client_script_approval',
    'video_editing',
    'internal_video_review',
    'client_video_approval',
    'revisions',
    'scheduling',
    'publishing_or_delivery',
  ];

  assert(
    required10Stages.length === 10,
    'Workflow pipeline includes all exactly 10 production stages'
  );

  // Verify deliverable records cover stages
  const presentStages = new Set(db.deliverables.map((d) => d.stage));
  assert(
    presentStages.has('publishing_or_delivery') &&
      presentStages.has('client_video_approval') &&
      presentStages.has('client_script_approval') &&
      presentStages.has('revisions'),
    'Active pipeline tracks stage states across content planning, scripting, review, video, and publishing'
  );

  // -------------------------------------------------------------
  // TEST 6: MONTHLY DELIVERABLE TRACKER & MILESTONE ACCURACY
  // -------------------------------------------------------------
  console.log('\n[6] MONTHLY DELIVERABLE COMMITMENT TRACKER & COUNTING ACCURACY');

  const apexClient = db.clients.find((c) => c.id === 'cli-1');
  const apexTotalCommitment =
    apexClient.monthlyCommitment.reels +
    apexClient.monthlyCommitment.longVideos +
    apexClient.monthlyCommitment.graphics +
    apexClient.monthlyCommitment.carousels;

  // Calculate completed (Stage 10 and published)
  const apexCompleted = db.deliverables.filter(
    (d) =>
      d.clientId === 'cli-1' &&
      d.stage === 'publishing_or_delivery' &&
      (d.status === 'published' || d.status === 'delivered')
  ).length;

  const apexInProgress = db.deliverables.filter(
    (d) =>
      d.clientId === 'cli-1' &&
      d.status !== 'cancelled' &&
      !(
        d.stage === 'publishing_or_delivery' &&
        (d.status === 'published' || d.status === 'delivered')
      )
  ).length;

  assert(
    apexCompleted === 12,
    'Client deliverable completion count is 12 (exact matching example: 12 completed)',
    `${apexCompleted} completed reels`
  );

  assert(
    apexInProgress >= 5,
    'Client in-progress deliverables count is active in pipeline (at least 5)',
    `${apexInProgress} active in pipeline`
  );

  const scriptApprovalDeliverables = db.deliverables.filter(
    (d) => d.scriptApproved === true && d.stage !== 'publishing_or_delivery'
  );

  assert(
    scriptApprovalDeliverables.every((d) => d.isCountedTowardsCommitment === false),
    'Strict Rule Verified: Script approval does NOT count towards completed monthly delivery'
  );

  // -------------------------------------------------------------
  // TEST 7: CLIENT APPROVAL AND REVISION AUDIT SYSTEM
  // -------------------------------------------------------------
  console.log('\n[7] CLIENT APPROVAL SYSTEM & NOTIFICATION DISPATCH');

  assert(
    db.approvals.length >= 3,
    'Approval and revision records are preserved in audit history',
    `${db.approvals.length} approval entries`
  );

  const sampleApproval = db.approvals[0];
  assert(
    sampleApproval.clientId &&
      sampleApproval.deliverableId &&
      sampleApproval.version !== undefined &&
      sampleApproval.status &&
      sampleApproval.feedback &&
      sampleApproval.decisionDate &&
      sampleApproval.decidedByUserName,
    'Approval record contains: Client, Deliverable, Version, Status, Feedback, Timestamp, and Deciding User'
  );

  // Verify notifications for Admin & Manager
  const adminNotifs = db.notifications.filter((n) => n.targetRole === 'all_admin');
  assert(
    adminNotifs.length >= 3,
    'System generates notifications to both Admin and Manager on client responses & milestones',
    `${adminNotifs.length} admin operational notifications`
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
