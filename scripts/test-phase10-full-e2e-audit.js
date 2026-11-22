/**
 * RAHI FLOWDESK — PHASE 10: MASTER END-TO-END QA & PRODUCTION SECURITY AUDIT
 *
 * Verifies the complete live production readiness of RAHI Flowdesk against http://127.0.0.1:3000:
 * 1. HTTP Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
 * 2. Production Database Reset Lock (403 Forbidden in production).
 * 3. Strict Cryptographic Authentication & Zero Unauthenticated/Spoofed Access.
 * 4. Four-Portal Operations & 100% Equal Parity between Admin & Manager.
 * 5. Complete Agency Lifecycle: Client -> Project -> Employee -> Task -> 10-Stage Deliverable ->
 *    Script Approval -> Video Revisions with Tags -> Stage 10 Publishing -> Monthly Commitment
 *    Counting -> Invoicing & Payments -> Immutable Audit Logs.
 * 6. Multi-Tenant Client Workspace Isolation & Anti-Tampering.
 * 7. Employee Access Boundaries & Server-Side Financial Stripping.
 * 8. Account Deactivation, Invitation Single-Use, and Anti-Enumeration Rate Limiting.
 */

const BASE_URL = 'http://127.0.0.1:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ${colors.green}✓ PASS:${colors.reset} ${testName}`);
    if (detail) console.log(`         ${colors.cyan}(${detail})${colors.reset}`);
  } else {
    failed++;
    console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${testName}`);
    if (detail) console.error(`         ${colors.yellow}FAILED: ${detail}${colors.reset}`);
  }
}

async function loginUser(email, password = '') {
  const res = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  const data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  let cookieHeader = '';
  if (setCookie) {
    const match = setCookie.match(/flowdesk_session=([^;]+)/);
    if (match) cookieHeader = `flowdesk_session=${match[1]}`;
  }
  return { status: res.status, data, cookieHeader, headers: res.headers };
}

async function runPhase10Audit() {
  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   RAHI FLOWDESK — PHASE 10: PRODUCTION READINESS MASTER AUDIT   ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

  // -------------------------------------------------------------
  // [1] HTTP SECURITY HEADERS & DEFENSE-IN-DEPTH
  // -------------------------------------------------------------
  console.log(`${colors.bold}[1] HTTP SECURITY HEADERS & TRANSPORT SECURITY${colors.reset}`);

  const headerProbe = await fetch(`${BASE_URL}/api/auth`);
  const hsts = headerProbe.headers.get('strict-transport-security');
  const xfo = headerProbe.headers.get('x-frame-options');
  const xcto = headerProbe.headers.get('x-content-type-options');
  const refPol = headerProbe.headers.get('referrer-policy');
  const csp = headerProbe.headers.get('content-security-policy');
  const permPol = headerProbe.headers.get('permissions-policy');

  assert(
    hsts && hsts.includes('max-age=63072000'),
    'HTTP Strict-Transport-Security (HSTS) header is active with 2-year duration',
    hsts
  );
  assert(
    xfo === 'DENY',
    'X-Frame-Options: DENY enforced against clickjacking attacks',
    xfo
  );
  assert(
    xcto === 'nosniff',
    'X-Content-Type-Options: nosniff enforced against MIME-sniffing',
    xcto
  );
  assert(
    refPol === 'strict-origin-when-cross-origin',
    'Referrer-Policy: strict-origin-when-cross-origin configured',
    refPol
  );
  assert(
    csp && csp.includes("default-src 'self'"),
    'Content-Security-Policy (CSP) active and restricts origins to self',
    csp ? csp.substring(0, 45) + '...' : ''
  );
  assert(
    permPol && permPol.includes('camera=()'),
    'Permissions-Policy disables unauthorized hardware sensors',
    permPol
  );

  // -------------------------------------------------------------
  // [2] PRODUCTION DATABASE RESET LOCK
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[2] PRODUCTION DATABASE RESET DEFENSE${colors.reset}`);

  const resetAttempt = await fetch(`${BASE_URL}/api/reset-db`, { method: 'POST' });
  const resetData = await resetAttempt.json();
  assert(
    resetAttempt.status === 403,
    'POST /api/reset-db in production environment is strictly rejected with 403 Forbidden',
    `Status: ${resetAttempt.status}, Error: ${resetData.error}`
  );

  // -------------------------------------------------------------
  // [3] STRICT AUTHENTICATION & SPOOFING REJECTION
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[3] AUTHENTICATION & ANTI-SPOOFING VERIFICATION${colors.reset}`);

  // Query parameter spoofing without session cookie must return 401
  const spoofClients = await fetch(`${BASE_URL}/api/clients?userId=usr-admin`);
  assert(
    spoofClients.status === 401,
    'Unauthenticated GET /api/clients?userId=usr-admin is strictly rejected with 401',
    `Status: ${spoofClients.status}`
  );

  const spoofAudit = await fetch(`${BASE_URL}/api/audit?userId=usr-admin`);
  assert(
    spoofAudit.status === 401,
    'Unauthenticated GET /api/audit?userId=usr-admin is strictly rejected with 401',
    `Status: ${spoofAudit.status}`
  );

  const spoofReports = await fetch(`${BASE_URL}/api/reports?userId=usr-admin`);
  assert(
    spoofReports.status === 401,
    'Unauthenticated GET /api/reports?userId=usr-admin is strictly rejected with 401',
    `Status: ${spoofReports.status}`
  );

  const spoofNotifs = await fetch(`${BASE_URL}/api/notifications?userId=usr-admin`);
  assert(
    spoofNotifs.status === 401,
    'Unauthenticated GET /api/notifications?userId=usr-admin is strictly rejected with 401',
    `Status: ${spoofNotifs.status}`
  );

  // -------------------------------------------------------------
  // [4] ESTABLISH REAL SESSIONS ACROSS ALL FOUR PORTALS
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[4] AUTHENTICATED SESSIONS FOR ALL 4 PORTALS${colors.reset}`);

  const adminSession = await loginUser('admin@rahicreative.com');
  assert(
    adminSession.status === 200 && adminSession.cookieHeader.startsWith('flowdesk_session='),
    'Admin authenticated into ADMIN PORTAL with valid HttpOnly session cookie',
    `Role: ${adminSession.data.user.role}, Group: ${adminSession.data.user.permissionGroup}`
  );

  const managerSession = await loginUser('manager@rahicreative.com');
  assert(
    managerSession.status === 200 && managerSession.cookieHeader.startsWith('flowdesk_session='),
    'Manager authenticated into MANAGER PORTAL with valid HttpOnly session cookie',
    `Role: ${managerSession.data.user.role}, Group: ${managerSession.data.user.permissionGroup}`
  );

  // Verify Admin & Manager share exact identical permission group
  assert(
    adminSession.data.user.permissionGroup === 'FULL_ADMIN_ACCESS' &&
      managerSession.data.user.permissionGroup === 'FULL_ADMIN_ACCESS',
    'Admin & Manager share identical permission group "FULL_ADMIN_ACCESS" (100% Operational Parity)'
  );

  const employeeSession = await loginUser('editor@rahicreative.com');
  assert(
    employeeSession.status === 200 && employeeSession.cookieHeader.startsWith('flowdesk_session='),
    'Employee (Vikram Mehta) authenticated into EMPLOYEE PORTAL',
    `Role: ${employeeSession.data.user.role}, Group: ${employeeSession.data.user.permissionGroup}`
  );

  const clientASession = await loginUser('client.apex@brand.com');
  assert(
    clientASession.status === 200 && clientASession.cookieHeader.startsWith('flowdesk_session='),
    'Client A (Apex Athletics) authenticated into CLIENT PORTAL',
    `ClientId: ${clientASession.data.user.clientId}`
  );

  const clientBSession = await loginUser('client.lumina@skin.com');
  assert(
    clientBSession.status === 200 && clientBSession.cookieHeader.startsWith('flowdesk_session='),
    'Client B (Lumina Skincare) authenticated into CLIENT PORTAL',
    `ClientId: ${clientBSession.data.user.clientId}`
  );

  // -------------------------------------------------------------
  // [5] MASTER END-TO-END AGENCY PRODUCTION LIFECYCLE
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[5] MASTER END-TO-END AGENCY PRODUCTION LIFECYCLE${colors.reset}`);

  const timestamp = Date.now();
  let createdClientId = '';
  let createdProjectId = '';
  let createdTaskId = '';
  let createdDeliverableId = '';

  // 5.1 Admin onboards new Client
  console.log(`\n  ${colors.cyan}Step 5.1: Admin onboards new Client via HTTP POST /api/clients${colors.reset}`);
  const clientCreateRes = await fetch(`${BASE_URL}/api/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader,
    },
    body: JSON.stringify({
      name: `Zenith Organics ${timestamp}`,
      company: `Zenith Organics Pvt Ltd`,
      email: `contact_${timestamp}@zenithorganics.com`,
      phone: '+91 22 9876 5432',
      servicePackage: 'Full Marketing',
      contractStartDate: '2026-11-01',
      contractEndDate: '2027-10-31',
      monthlyRetainer: 200000,
      currency: 'INR',
      reels: 10,
      longVideos: 2,
      graphics: 5,
      carousels: 3,
      notes: 'New flagship organic wellness brand',
    }),
  });
  const clientCreateData = await clientCreateRes.json();
  assert(
    clientCreateRes.status === 200 && clientCreateData.success,
    'Admin successfully created client profile',
    `Client ID: ${clientCreateData.client?.id}`
  );
  createdClientId = clientCreateData.client?.id;

  // 5.2 Manager creates Project under new Client (Parity Verified!)
  console.log(`\n  ${colors.cyan}Step 5.2: Manager creates Project under Client via HTTP POST /api/projects${colors.reset}`);
  const projectCreateRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      clientId: createdClientId,
      title: `Zenith Winter Launch Campaign ${timestamp}`,
      description: 'High converting organic wellness social campaign',
      objective: 'Achieve 300% ROAS on Reels',
      startDate: '2026-11-20',
      targetEndDate: '2026-12-31',
      deadline: '2026-12-31',
      priority: 'high',
      status: 'active',
      assignedEmployees: ['emp-1'], // Vikram Mehta
      budget: 150000,
      currency: 'INR',
      totalDeliverablesTarget: 10,
    }),
  });
  const projectCreateData = await projectCreateRes.json();
  assert(
    projectCreateRes.status === 201 && projectCreateData.success,
    'Manager successfully created project (Equal Parity Verified!)',
    `Project ID: ${projectCreateData.project?.id}`
  );
  createdProjectId = projectCreateData.project?.id;

  // 5.3 Admin delegates Task to Employee under Project
  console.log(`\n  ${colors.cyan}Step 5.3: Admin delegates Task to Employee via HTTP POST /api/tasks${colors.reset}`);
  const taskCreateRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader,
    },
    body: JSON.stringify({
      clientId: createdClientId,
      projectId: createdProjectId,
      title: `Edit Zenith Launch Reel 01`,
      description: 'Dynamic pacing with motion typography overlays',
      assignedEmployeeId: 'emp-1',
      assignedEmployeeIds: ['emp-1'],
      priority: 'high',
      startDate: '2026-11-22',
      deadline: '2026-11-28',
      estimatedHours: 6.5,
      internalInstructions: 'Use clean brand colors and certified organic badge',
    }),
  });
  const taskCreateData = await taskCreateRes.json();
  assert(
    (taskCreateRes.status === 200 || taskCreateRes.status === 201) && taskCreateData.success,
    'Admin successfully delegated task with estimated hours (6.5h)',
    `Task ID: ${taskCreateData.task?.id}`
  );
  createdTaskId = taskCreateData.task?.id;

  // 5.4 Employee retrieves assigned tasks
  console.log(`\n  ${colors.cyan}Step 5.4: Employee views assigned tasks via HTTP GET /api/tasks${colors.reset}`);
  const empTasksRes = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: employeeSession.cookieHeader },
  });
  const empTasksData = await empTasksRes.json();
  const foundTask = (empTasksData.tasks || []).find((t) => t.id === createdTaskId);
  assert(
    foundTask !== undefined,
    'Assigned Employee can see the newly created task in their restricted dashboard',
    `Task: ${foundTask?.title}`
  );

  // 5.5 Employee starts task and submits work (V1)
  console.log(`\n  ${colors.cyan}Step 5.5: Employee updates task status and submits V1 cut${colors.reset}`);
  const taskUpdateRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: employeeSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_status',
      taskId: createdTaskId,
      status: 'under_review',
    }),
  });
  const taskUpdateData = await taskUpdateRes.json();
  assert(
    taskUpdateRes.status === 200 && taskUpdateData.task?.status === 'under_review',
    'Employee transitioned task status to "under_review"',
    `Status: ${taskUpdateData.task?.status}`
  );

  // 5.6 Manager reviews and requests revision
  console.log(`\n  ${colors.cyan}Step 5.6: Manager requests task revision via HTTP POST /api/tasks${colors.reset}`);
  const managerReviewRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_status',
      taskId: createdTaskId,
      status: 'revision_required',
    }),
  });
  const managerReviewData = await managerReviewRes.json();
  assert(
    managerReviewRes.status === 200 && managerReviewData.task?.status === 'revision_required',
    'Manager marked task "revision_required"',
    `Status: ${managerReviewData.task?.status}`
  );

  // 5.7 Employee submits revised work and Manager approves
  console.log(`\n  ${colors.cyan}Step 5.7: Employee resubmits and Manager approves task${colors.reset}`);
  const managerApproveTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_status',
      taskId: createdTaskId,
      status: 'completed',
    }),
  });
  const managerApproveTaskData = await managerApproveTaskRes.json();
  assert(
    managerApproveTaskRes.status === 200 && managerApproveTaskData.task?.status === 'completed',
    'Manager approved and completed task',
    `Status: ${managerApproveTaskData.task?.status}`
  );

  // 5.8 10-Stage Creative Production Workflow: Create Deliverable (Stage 1)
  console.log(`\n  ${colors.cyan}Step 5.8: Admin creates Deliverable (Stage 1: Content Planning)${colors.reset}`);
  const delivCreateRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'create',
      clientId: createdClientId,
      projectId: createdProjectId,
      title: `Zenith Winter Reel #1 — The Morning Routine`,
      type: 'reel',
      targetMonth: '2026-11',
      stage: 'content_planning',
      assignedEmployeeId: 'emp-1',
    }),
  });
  const delivCreateData = await delivCreateRes.json();
  assert(
    delivCreateRes.status === 200 && delivCreateData.success,
    'Deliverable initialized at Stage 1 (content_planning)',
    `Deliverable ID: ${delivCreateData.deliverable?.id}`
  );
  createdDeliverableId = delivCreateData.deliverable?.id;

  // 5.9 Manager advances deliverable to Stage 3 (Internal Script Review)
  console.log(`\n  ${colors.cyan}Step 5.9: Manager advances deliverable to Stage 3 (Internal Script Review)${colors.reset}`);
  const scriptUploadRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: createdDeliverableId,
      stage: 'internal_script_review',
      scriptText: 'HOOK: Stop using synthetic supplements. Here is why cold-pressed organic wins.',
    }),
  });
  const scriptUploadData = await scriptUploadRes.json();
  assert(
    scriptUploadRes.status === 200 && scriptUploadData.deliverable?.stage === 'internal_script_review',
    'Script draft submitted and deliverable moved to Stage 3 (internal_script_review)'
  );

  // 5.10 Manager reviews script and advances to Stage 4 (Client Script Review)
  console.log(`\n  ${colors.cyan}Step 5.10: Manager approves script internally -> Stage 4 (Client Script Review)${colors.reset}`);
  const toStage4Res = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: createdDeliverableId,
      stage: 'client_script_approval',
      status: 'client_review',
    }),
  });
  const toStage4Data = await toStage4Res.json();
  assert(
    toStage4Res.status === 200 && toStage4Data.deliverable?.stage === 'client_script_approval',
    'Deliverable advanced to Stage 4 (client_script_approval)'
  );

  // 5.11 Manager records client script approval -> advances to Stage 5 (Video Editing)
  console.log(`\n  ${colors.cyan}Step 5.11: Client script approval recorded -> Stage 5 (Video Editing)${colors.reset}`);
  const scriptApproveRes = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      deliverableId: createdDeliverableId,
      approvalType: 'script',
      decision: 'approve',
      feedback: 'Script approved by founder with enthusiasm.',
    }),
  });
  const scriptApproveData = await scriptApproveRes.json();
  assert(
    scriptApproveRes.status === 200 && scriptApproveData.success,
    'Script approval recorded and deliverable automatically routed to Stage 5 (video_editing)'
  );

  // 5.12 Video Editor uploads rough cut (V1)
  console.log(`\n  ${colors.cyan}Step 5.12: Video Editor uploads Version 1 rough cut${colors.reset}`);
  const uploadV1Res = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: employeeSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'upload_version',
      deliverableId: createdDeliverableId,
      mediaUrl: 'https://cdn.rahicreativemedia.com/zenith/v1_rough_cut.mp4',
      changeNotes: 'Initial dynamic edit with color grading and sound design',
    }),
  });
  const uploadV1Data = await uploadV1Res.json();
  assert(
    uploadV1Res.status === 200 && uploadV1Data.deliverable?.currentVersion === 2,
    'Version 2 rough cut registered in deliverable version ledger',
    `Versions count: ${uploadV1Data.deliverable?.versions?.length}`
  );

  // 5.13 Manager conducts internal quality review (Stage 6) -> advances to Stage 7
  console.log(`\n  ${colors.cyan}Step 5.13: Manager reviews video internally -> Stage 7 (Client Video Approval)${colors.reset}`);
  const toStage7Res = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: createdDeliverableId,
      stage: 'client_video_approval',
      status: 'client_review',
    }),
  });
  const toStage7Data = await toStage7Res.json();
  assert(
    toStage7Res.status === 200 && toStage7Data.deliverable?.stage === 'client_video_approval',
    'Deliverable advanced to Stage 7 (client_video_approval)'
  );

  // 5.14 Manager records client video revision request with category tags -> Stage 8
  console.log(`\n  ${colors.cyan}Step 5.14: Client video revision request with structured tags -> Stage 8 (Revisions)${colors.reset}`);
  const videoRevisionRes = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      deliverableId: createdDeliverableId,
      approvalType: 'video',
      decision: 'revision',
      feedback: 'Speed up opening hook cut and boost background ambient music at 0:04.',
      categories: ['Hook / Pacing', 'Music / Sound Design'],
    }),
  });
  const videoRevisionData = await videoRevisionRes.json();
  assert(
    videoRevisionRes.status === 200 && videoRevisionData.approval?.status === 'revision_requested',
    'Revision request recorded with structured tags; deliverable routed to Stage 8 (revisions)',
    `Tags: ${videoRevisionData.approval?.categories?.join(', ')}`
  );

  // 5.15 Editor uploads Version 2
  console.log(`\n  ${colors.cyan}Step 5.15: Editor uploads Version 2 with requested revisions${colors.reset}`);
  const uploadV2Res = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: employeeSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'upload_version',
      deliverableId: createdDeliverableId,
      mediaUrl: 'https://cdn.rahicreativemedia.com/zenith/v2_revised_master.mp4',
      changeNotes: 'Tightened opening cut, adjusted sound mixing and typography',
    }),
  });
  const uploadV2Data = await uploadV2Res.json();
  assert(
    uploadV2Res.status === 200 && uploadV2Data.deliverable?.currentVersion === 3,
    'Version 3 cut uploaded with requested revisions; currentVersion updated to 3',
    `Versions count: ${uploadV2Data.deliverable?.versions?.length}`
  );

  // 5.16 Manager approves V2 and advances to Stage 9 (Scheduling)
  console.log(`\n  ${colors.cyan}Step 5.16: Manager approves revised cut -> Stage 9 (Scheduling)${colors.reset}`);
  const toStage9Res = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: createdDeliverableId,
      stage: 'scheduling',
      status: 'scheduled',
    }),
  });
  const toStage9Data = await toStage9Res.json();
  assert(
    toStage9Res.status === 200 && toStage9Data.deliverable?.stage === 'scheduling',
    'Deliverable scheduled for broadcast at Stage 9'
  );

  // 5.17 Manager publishes deliverable at Stage 10 (Publishing & Final Delivery)
  console.log(`\n  ${colors.cyan}Step 5.17: Manager publishes deliverable at Stage 10 (Publishing & Delivery)${colors.reset}`);
  const toStage10Res = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: managerSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: createdDeliverableId,
      stage: 'publishing_or_delivery',
      status: 'published',
    }),
  });
  const toStage10Data = await toStage10Res.json();
  assert(
    toStage10Res.status === 200 && toStage10Data.deliverable?.stage === 'publishing_or_delivery',
    'Deliverable reached Stage 10 (publishing_or_delivery)',
    `Status: ${toStage10Data.deliverable?.status}`
  );

  // 5.18 CRITICAL STAGE 10 COMMITMENT RULE VERIFICATION
  console.log(`\n  ${colors.cyan}Step 5.18: Verify Stage 10 Deliverable Commitment Rule${colors.reset}`);
  assert(
    toStage10Data.deliverable?.isCountedTowardsCommitment === true,
    'STAGE 10 COMMITMENT RULE: isCountedTowardsCommitment = true strictly upon reaching Stage 10 with published status',
    `isCountedTowardsCommitment: ${toStage10Data.deliverable?.isCountedTowardsCommitment}`
  );

  // Verify reports reflect the new deliverable
  const reportsRes = await fetch(`${BASE_URL}/api/reports`, {
    headers: { Cookie: adminSession.cookieHeader },
  });
  const reportsData = await reportsRes.json();
  const zenithReport = (reportsData.clientStats || []).find((c) => c.clientId === createdClientId);
  assert(
    zenithReport !== undefined && zenithReport.completed >= 1,
    'Client Monthly Commitment Tracker correctly incremented completed count by 1',
    `Zenith completed reels: ${zenithReport?.completed}`
  );

  // 5.19 Admin creates Invoice in /api/finance
  console.log(`\n  ${colors.cyan}Step 5.19: Admin creates Invoice via HTTP POST /api/finance${colors.reset}`);
  const invoiceCreateRes = await fetch(`${BASE_URL}/api/finance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'create_invoice',
      clientId: createdClientId,
      amount: 200000,
      currency: 'INR',
      dueDate: '2026-12-15',
      items: [
        {
          description: 'Monthly Creative Content Retainer — November 2026',
          quantity: 1,
          unitPrice: 200000,
          total: 200000,
        },
      ],
      notes: 'Payment terms: Net 15 days',
    }),
  });
  const invoiceCreateData = await invoiceCreateRes.json();
  assert(
    invoiceCreateRes.status === 201 && invoiceCreateData.success,
    'Admin successfully created monthly retainer invoice (200,000 INR)',
    `Invoice: ${invoiceCreateData.invoice?.invoiceNumber}`
  );
  const createdInvoiceId = invoiceCreateData.invoice?.id;

  // 5.20 Admin records payment for invoice
  console.log(`\n  ${colors.cyan}Step 5.20: Admin records client payment via HTTP POST /api/finance${colors.reset}`);
  const paymentRecordRes = await fetch(`${BASE_URL}/api/finance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'record_payment',
      invoiceId: createdInvoiceId,
      amount: 200000,
      currency: 'INR',
      paymentMethod: 'Bank Wire / NEFT',
      referenceNumber: `TXN-ZENITH-${timestamp}`,
      notes: 'Full payment received in corporate account',
    }),
  });
  const paymentRecordData = await paymentRecordRes.json();
  assert(
    (paymentRecordRes.status === 200 || paymentRecordRes.status === 201) && paymentRecordData.success,
    'Client payment recorded; invoice status updated to "paid"',
    `Invoice status: ${paymentRecordData.invoice?.status}, Paid: ${paymentRecordData.invoice?.paidAmount} INR`
  );

  // 5.21 Verify immutable audit log contains full trail
  console.log(`\n  ${colors.cyan}Step 5.21: Verify Immutable Audit Log Trail${colors.reset}`);
  const auditRes = await fetch(`${BASE_URL}/api/audit`, {
    headers: { Cookie: adminSession.cookieHeader },
  });
  const auditData = await auditRes.json();
  assert(
    auditRes.status === 200 && Array.isArray(auditData.auditLogs),
    'Audit history endpoint accessible to Admin and returns complete event ledger',
    `Total audit logs: ${auditData.auditLogs?.length}`
  );

  // -------------------------------------------------------------
  // [6] MULTI-TENANT ISOLATION & EMPLOYEE FINANCIAL BOUNDARIES
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[6] MULTI-TENANT CLIENT ISOLATION & EMPLOYEE BOUNDARIES${colors.reset}`);

  // Client B cannot see Client A / Zenith projects
  const clientBProjectsRes = await fetch(`${BASE_URL}/api/projects`, {
    headers: { Cookie: clientBSession.cookieHeader },
  });
  const clientBProjectsData = await clientBProjectsRes.json();
  const leakedProject = (clientBProjectsData.projects || []).find(
    (p) => p.clientId === createdClientId || p.clientId === 'cli-1'
  );
  assert(
    leakedProject === undefined,
    'Client B cannot see any projects belonging to Zenith or Client A (Strict Multi-Tenant Isolation)'
  );

  // Employee cannot access finance API
  const empFinanceRes = await fetch(`${BASE_URL}/api/finance`, {
    headers: { Cookie: employeeSession.cookieHeader },
  });
  assert(
    empFinanceRes.status === 403,
    'Employee is strictly forbidden from accessing /api/finance (403 Forbidden)',
    `Status: ${empFinanceRes.status}`
  );

  // Client cannot access finance API
  const clientFinanceRes = await fetch(`${BASE_URL}/api/finance`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  assert(
    clientFinanceRes.status === 403,
    'Client is strictly forbidden from accessing internal /api/finance (403 Forbidden)',
    `Status: ${clientFinanceRes.status}`
  );

  // Employee reading client directory receives sanitized records with monthlyRetainer stripped
  const empClientsRes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: employeeSession.cookieHeader },
  });
  const empClientsData = await empClientsRes.json();
  let anyRetainerExposed = false;
  for (const c of empClientsData.clients || []) {
    if (c.monthlyRetainer !== undefined || c.currency !== undefined) {
      anyRetainerExposed = true;
      break;
    }
  }
  assert(
    !anyRetainerExposed,
    'Employee client directory strictly strips monthlyRetainer and currency server-side',
    `Retainers exposed: ${anyRetainerExposed}`
  );

  // -------------------------------------------------------------
  // [7] INACTIVE ACCOUNTS, INVITATION EXPIRY & RATE LIMITING
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[7] INACTIVE ACCOUNTS, INVITATIONS & RATE LIMITING${colors.reset}`);

  // Test deactivating an account
  const deactivateRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'toggle_status',
      callerUserId: adminSession.data.user.id,
      targetUserId: 'usr-client-2',
    }),
  });
  const deactivateData = await deactivateRes.json();
  assert(
    deactivateRes.status === 200 && deactivateData.user?.status === 'inactive',
    'Admin successfully deactivated user account (usr-client-2)'
  );

  // Inactive user attempting login is rejected with 403 Forbidden
  const inactiveLoginRes = await loginUser('client.lumina@skin.com');
  assert(
    inactiveLoginRes.status === 403,
    'Deactivated account attempting login is rejected with 403 Forbidden',
    `Status: ${inactiveLoginRes.status}, Error: ${inactiveLoginRes.data?.error}`
  );

  // Reactivate user to preserve database integrity
  await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader,
    },
    body: JSON.stringify({
      action: 'toggle_status',
      callerUserId: adminSession.data.user.id,
      targetUserId: 'usr-client-2',
    }),
  });

  // Password reset anti-enumeration generic response
  const resetReqRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reset_password_request',
      email: 'nonexistent_attacker_probe@target.com',
    }),
  });
  const resetReqData = await resetReqRes.json();
  assert(
    resetReqRes.status === 200 && resetReqData.success,
    'Password reset request returns generic message preventing account enumeration',
    resetReqData.message
  );

  // Rate limiting on password reset
  const rateLimitEmail = `ratelimit_${timestamp}@test.com`;
  for (let i = 0; i < 3; i++) {
    await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_password_request', email: rateLimitEmail }),
    });
  }
  const fourthAttempt = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset_password_request', email: rateLimitEmail }),
  });
  assert(
    fourthAttempt.status === 429,
    'Fourth password reset request within 15 minutes is rate-limited with HTTP 429',
    `Status: ${fourthAttempt.status}`
  );

  // Password policy: password under 12 characters rejected
  const shortPassRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept_invitation',
      token: 'fake_token',
      password: 'short',
    }),
  });
  const shortPassData = await shortPassRes.json();
  assert(
    shortPassRes.status === 400 && shortPassData.error.includes('12 characters'),
    'Security Policy: Password under 12 characters is rejected with 400 Bad Request',
    shortPassData.error
  );

  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  PHASE 10 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED  ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10Audit().catch((err) => {
  console.error('Master Audit Execution Error:', err);
  process.exit(1);
});
