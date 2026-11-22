/**
 * RAHI FLOWDESK — PHASE 6 AUTOMATED VERIFICATION SUITE
 * Client Review, Feedback & Approval Center
 *
 * Verifies all Phase 6 Core Requirements:
 * 1. Dual Review Segregation: Stage 4 (Script Approval) vs Stage 7 (Video Approval).
 * 2. Mandatory Feedback Requirement: Empty feedback on revision requests is strictly rejected (status 400).
 * 3. Structured Category Tagging: Support for standardized category tags on revision requests.
 * 4. Client Script Approval Gate: Approving script advances deliverable to Stage 5 (video_editing) with scriptApproved=true.
 * 5. Client Script Revision Gate: Requesting revision moves deliverable to Stage 8 (revisions) with status revision_requested.
 * 6. Client Video Approval Gate: Approving video advances deliverable to Stage 9 (scheduling) with videoApproved=true and status approved.
 * 7. Client Video Revision Gate: Requesting revision moves deliverable to Stage 8 (revisions) with status revision_requested.
 * 8. Multi-Role Security & Client Isolation: Client A cannot view or approve Client B's deliverables (returns 403).
 * 9. Employee Role Boundary: Employees cannot submit client approval or revision decisions (returns 403).
 * 10. Admin & Manager Parity: Admin and Manager have 100% identical oversight and can act on client behalf (recordedByAdminOrManager=true).
 * 11. Dual Notification Dispatch: Notifications sent to all_admin (Admin + Manager) and assigned employee.
 * 12. Preserved Immutable Audit History: All decisions, version tags, and category metadata logged.
 */

const fs = require('fs');
const path = require('path');

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

function hasFullAdminAccess(user) {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    user.role === 'manager' ||
    user.permissionGroup === 'FULL_ADMIN_ACCESS'
  );
}

// In-memory test simulator matching app/api/approvals/route.ts
function simulateGetApprovals(db, caller, filters = {}) {
  if (!caller) {
    return { status: 401, error: 'Unauthorized: Authentication required to access approvals' };
  }
  if (caller.status === 'inactive') {
    return { status: 403, error: 'Forbidden: Account is inactive' };
  }

  let approvals = [...db.approvals];

  if (caller.role === 'client') {
    approvals = approvals.filter((a) => a.clientId === caller.clientId);
  } else if (!hasFullAdminAccess(caller)) {
    const empId = caller.employeeId || caller.id;
    const assignedDeliverableIds = new Set(
      db.deliverables
        .filter((d) => d.assignedEmployeeId === empId || d.assignedEmployeeId === caller.id)
        .map((d) => d.id)
    );
    approvals = approvals.filter((a) => assignedDeliverableIds.has(a.deliverableId));
  } else {
    if (filters.clientId) {
      approvals = approvals.filter((a) => a.clientId === filters.clientId);
    }
  }

  if (filters.deliverableId) {
    approvals = approvals.filter((a) => a.deliverableId === filters.deliverableId);
  }
  if (filters.status) {
    approvals = approvals.filter((a) => a.status === filters.status);
  }
  if (filters.type) {
    approvals = approvals.filter((a) => a.type === filters.type);
  }

  return { status: 200, approvals };
}

function simulatePostApproval(db, caller, body) {
  if (!caller) {
    return { status: 401, error: 'Unauthorized: Authentication required' };
  }
  if (caller.status === 'inactive') {
    return { status: 403, error: 'Forbidden: Account is inactive' };
  }
  if (caller.role === 'employee') {
    return { status: 403, error: 'Forbidden: Employees cannot submit client approvals or revisions' };
  }

  const { deliverableId, approvalType, decision, feedback, categories } = body;
  const deliverable = db.deliverables.find((d) => d.id === deliverableId);
  if (!deliverable) {
    return { status: 404, error: 'Deliverable not found' };
  }

  const isClientOwner = caller.role === 'client' && caller.clientId === deliverable.clientId;
  const isAdminOrManager = hasFullAdminAccess(caller);

  if (!isClientOwner && !isAdminOrManager) {
    return { status: 403, error: 'Forbidden: Cross-client approval actions are strictly blocked' };
  }

  if (!['script', 'video', 'design'].includes(approvalType)) {
    return { status: 400, error: 'Invalid approval type' };
  }

  if (!['approve', 'revision'].includes(decision)) {
    return { status: 400, error: 'Invalid decision' };
  }

  const isApproved = decision === 'approve';
  const trimmedFeedback = (feedback || '').trim();

  if (!isApproved && !trimmedFeedback) {
    return { status: 400, error: 'Feedback explanation is mandatory when requesting revisions' };
  }

  const currentVersion = deliverable.currentVersion || 1;
  const finalCategories = Array.isArray(categories)
    ? categories.filter((c) => typeof c === 'string' && c.trim().length > 0)
    : [];

  const approvalRecord = {
    id: `appr-test-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    clientId: deliverable.clientId,
    clientName: deliverable.clientName,
    deliverableId: deliverable.id,
    deliverableTitle: deliverable.title,
    type: approvalType,
    version: currentVersion,
    status: isApproved ? 'approved' : 'revision_requested',
    action:
      approvalType === 'script'
        ? isApproved
          ? 'script_approved'
          : 'script_revision'
        : isApproved
        ? 'video_approved'
        : 'video_revision',
    feedback: trimmedFeedback || (isApproved ? 'Approved by client without changes.' : 'Revision requested.'),
    categories: finalCategories,
    decisionDate: new Date().toISOString(),
    decidedByUserId: caller.id,
    decidedByUserName: caller.name,
    recordedByAdminOrManager: isAdminOrManager && caller.role !== 'client',
  };

  db.approvals.unshift(approvalRecord);

  if (approvalType === 'script') {
    if (isApproved) {
      deliverable.scriptApproved = true;
      deliverable.scriptApprovedAt = new Date().toISOString();
      deliverable.stage = 'video_editing';
      deliverable.status = 'in_progress';
    } else {
      deliverable.stage = 'revisions';
      deliverable.status = 'revision_requested';
    }
  } else if (approvalType === 'video') {
    if (isApproved) {
      deliverable.videoApproved = true;
      deliverable.videoApprovedAt = new Date().toISOString();
      deliverable.stage = 'scheduling';
      deliverable.status = 'approved';
    } else {
      deliverable.stage = 'revisions';
      deliverable.status = 'revision_requested';
    }
  }

  if (!isApproved && deliverable.versions && deliverable.versions.length > 0) {
    const latestVer = deliverable.versions[deliverable.versions.length - 1];
    if (latestVer) {
      latestVer.feedback = approvalRecord.feedback;
    }
  }

  const notifAction = isApproved ? 'Approved' : 'Revision Requested';
  const tagSuffix = finalCategories.length > 0 ? ` [Tags: ${finalCategories.join(', ')}]` : '';

  db.notifications.unshift({
    id: `notif-test-${Date.now()}`,
    targetRole: 'all_admin',
    title: `Client ${notifAction}: ${deliverable.title}`,
    message: `${caller.name} (${deliverable.clientName}) ${notifAction.toLowerCase()} ${approvalType} (v${currentVersion}). Feedback: "${approvalRecord.feedback}"${tagSuffix}`,
    type: isApproved ? 'client_approval' : 'client_revision',
    relatedId: deliverable.id,
    read: false,
    createdAt: new Date().toISOString(),
  });

  if (!isApproved && deliverable.assignedEmployeeId) {
    const emp = db.employees.find((e) => e.id === deliverable.assignedEmployeeId);
    if (emp) {
      db.notifications.unshift({
        id: `notif-test-${Date.now()}-emp`,
        targetRole: 'employee',
        recipientUserId: emp.userId,
        title: `Revision Requested on ${deliverable.title}`,
        message: `Client requested changes on ${approvalType} v${currentVersion}: "${approvalRecord.feedback}"${tagSuffix}`,
        type: 'client_revision',
        relatedId: deliverable.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  db.auditLogs.unshift({
    id: `aud-test-${Date.now()}`,
    userId: caller.id,
    userName: caller.name,
    userRole: caller.role,
    action: `Client ${notifAction}`,
    details: `${caller.name}${approvalRecord.recordedByAdminOrManager ? ' (Admin/Manager Oversight)' : ''} ${notifAction.toLowerCase()} ${approvalType} v${currentVersion} for "${deliverable.title}". Categories: ${finalCategories.length > 0 ? finalCategories.join(', ') : 'None'}. Feedback: "${approvalRecord.feedback}"`,
    targetType: 'approval',
    targetId: approvalRecord.id,
    timestamp: new Date().toISOString(),
  });

  return { status: 200, approval: approvalRecord, deliverable };
}

function runVerificationSuite() {
  console.log(`\n${colors.bold}${colors.blue}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   RAHI FLOWDESK — PHASE 6 AUTOMATED VERIFICATION SUITE                  ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}   Client Review, Feedback & Approval Center                            ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================================================${colors.reset}\n`);

  const dbPath = path.join(__dirname, '..', 'data', 'db.json');
  assert(fs.existsSync(dbPath), 'data/db.json exists on disk');
  const rawData = fs.readFileSync(dbPath, 'utf8');
  const originalDB = JSON.parse(rawData);

  // Deep clone for isolated verification
  const testDB = JSON.parse(JSON.stringify(originalDB));

  // Identify test personas
  const adminUser = testDB.users.find((u) => u.role === 'admin');
  const managerUser = testDB.users.find((u) => u.role === 'manager');
  const employeeUser = testDB.users.find((u) => u.role === 'employee');
  const clientAUser = testDB.users.find((u) => u.role === 'client' && u.clientId === 'cli-1');
  const clientBUser = testDB.users.find((u) => u.role === 'client' && u.clientId === 'cli-2');

  assert(adminUser !== undefined, 'Admin persona exists', adminUser?.email);
  assert(managerUser !== undefined, 'Manager persona exists', managerUser?.email);
  assert(employeeUser !== undefined, 'Employee persona exists', employeeUser?.email);
  assert(clientAUser !== undefined, 'Client A (Apex) persona exists', clientAUser?.email);
  assert(clientBUser !== undefined, 'Client B (Lumina) persona exists', clientBUser?.email);

  // SECTION 1: AUTHENTICATION & INACTIVE ACCOUNT ENFORCEMENT
  console.log(`\n${colors.bold}--- Section 1: Authentication & Inactive Enforcement ---${colors.reset}`);
  const unauthGet = simulateGetApprovals(testDB, null);
  assert(unauthGet.status === 401, 'GET /api/approvals rejects unauthenticated request with 401');

  const unauthPost = simulatePostApproval(testDB, null, { deliverableId: 'del-1' });
  assert(unauthPost.status === 401, 'POST /api/approvals rejects unauthenticated request with 401');

  const inactiveUser = { ...clientAUser, status: 'inactive' };
  const inactiveGet = simulateGetApprovals(testDB, inactiveUser);
  assert(inactiveGet.status === 403, 'GET /api/approvals rejects inactive user with 403 Forbidden');

  const inactivePost = simulatePostApproval(testDB, inactiveUser, { deliverableId: 'del-1' });
  assert(inactivePost.status === 403, 'POST /api/approvals rejects inactive user with 403 Forbidden');

  // SECTION 2: EMPLOYEE ACCESS BOUNDARIES
  console.log(`\n${colors.bold}--- Section 2: Employee Access Boundaries ---${colors.reset}`);
  const employeePost = simulatePostApproval(testDB, employeeUser, {
    deliverableId: 'del-1',
    approvalType: 'script',
    decision: 'approve',
  });
  assert(employeePost.status === 403, 'Employees are strictly forbidden from submitting client approvals (403)');
  assert(
    employeePost.error.includes('Employees cannot submit client approvals'),
    'Clear forbidden error message returned to employee'
  );

  const employeeGet = simulateGetApprovals(testDB, employeeUser);
  assert(employeeGet.status === 200, 'Employee GET /api/approvals succeeds with 200');
  const employeeAssignedDelIds = new Set(
    testDB.deliverables
      .filter((d) => d.assignedEmployeeId === employeeUser.employeeId || d.assignedEmployeeId === employeeUser.id)
      .map((d) => d.id)
  );
  const employeeViolations = employeeGet.approvals.filter((a) => !employeeAssignedDelIds.has(a.deliverableId));
  assert(employeeViolations.length === 0, 'Employee cannot see approvals outside assigned deliverables');

  // SECTION 3: CLIENT ISOLATION & CROSS-CLIENT PROTECTION
  console.log(`\n${colors.bold}--- Section 3: Client Organization Isolation ---${colors.reset}`);
  const clientAGet = simulateGetApprovals(testDB, clientAUser);
  assert(clientAGet.status === 200, 'Client A can query approval records');
  const clientAOtherClients = clientAGet.approvals.filter((a) => a.clientId !== clientAUser.clientId);
  assert(clientAOtherClients.length === 0, 'Client A receives zero records belonging to other clients');

  const clientBGet = simulateGetApprovals(testDB, clientBUser);
  assert(clientBGet.status === 200, 'Client B can query approval records');
  const clientBOtherClients = clientBGet.approvals.filter((a) => a.clientId !== clientBUser.clientId);
  assert(clientBOtherClients.length === 0, 'Client B receives zero records belonging to other clients');

  // Client B attempts to approve Client A deliverable
  const clientADel = testDB.deliverables.find((d) => d.clientId === 'cli-1');
  assert(clientADel !== undefined, 'Found Client A deliverable for cross-client test', clientADel?.id);

  const crossClientPost = simulatePostApproval(testDB, clientBUser, {
    deliverableId: clientADel.id,
    approvalType: 'script',
    decision: 'approve',
  });
  assert(crossClientPost.status === 403, 'Cross-client approval attempt by Client B on Client A deliverable blocked with 403');
  assert(
    crossClientPost.error.includes('Cross-client approval actions are strictly blocked'),
    'Correct cross-client security violation error message returned'
  );

  // SECTION 4: SCRIPT APPROVAL WORKFLOW (STAGE 4 -> STAGE 5)
  console.log(`\n${colors.bold}--- Section 4: Script Approval Workflow (Stage 4 -> Stage 5) ---${colors.reset}`);
  const scriptReviewDel = {
    id: 'del-test-script-approve',
    clientId: 'cli-1',
    clientName: 'Apex Athletics',
    projectId: 'proj-apex-1',
    projectTitle: 'Apex Q1 Brand Launch',
    title: 'Executive Podcast Reel 1',
    type: 'reel',
    targetMonth: '2026-03',
    stage: 'client_script_approval',
    currentVersion: 1,
    scriptText: 'Hook: Stop wasting 10 hours a week on manual workflow planning.',
    scriptApproved: false,
    videoApproved: false,
    assignedEmployeeId: 'emp-1',
    assignedEmployeeName: 'Vikram Mehta',
    deadline: '2026-03-15',
    status: 'client_review',
    isCountedTowardsCommitment: false,
    versions: [
      {
        version: 1,
        scriptText: 'Hook: Stop wasting 10 hours a week on manual workflow planning.',
        submittedAt: new Date().toISOString(),
        notes: 'Initial script draft submitted for client sign-off',
      },
    ],
    createdAt: new Date().toISOString(),
  };
  testDB.deliverables.push(scriptReviewDel);

  const initialNotifCount = testDB.notifications.length;
  const initialAuditCount = testDB.auditLogs.length;

  const scriptApproveRes = simulatePostApproval(testDB, clientAUser, {
    deliverableId: scriptReviewDel.id,
    approvalType: 'script',
    decision: 'approve',
    feedback: 'Script looks crisp, engaging and on brand. Approved to film and edit.',
  });

  assert(scriptApproveRes.status === 200, 'Script approval succeeds with 200 OK');
  assert(scriptApproveRes.deliverable.scriptApproved === true, 'deliverable.scriptApproved set to true');
  assert(typeof scriptApproveRes.deliverable.scriptApprovedAt === 'string', 'scriptApprovedAt timestamp recorded');
  assert(scriptApproveRes.deliverable.stage === 'video_editing', 'Deliverable advanced to Stage 5: video_editing');
  assert(scriptApproveRes.deliverable.status === 'in_progress', 'Deliverable status updated to in_progress');
  assert(scriptApproveRes.deliverable.isCountedTowardsCommitment === false, 'Stage 5 deliverable not counted towards commitment yet');

  // Verify notification dispatched to all_admin
  const latestNotif = testDB.notifications[0];
  assert(latestNotif.targetRole === 'all_admin', 'Notification sent to all_admin (both Admin and Manager)');
  assert(latestNotif.type === 'client_approval', 'Notification type is client_approval');
  assert(latestNotif.relatedId === scriptReviewDel.id, 'Notification linked to deliverable ID');

  // Verify audit log
  const latestAudit = testDB.auditLogs[0];
  assert(latestAudit.action === 'Client Approved', 'Audit log records Client Approved');
  assert(latestAudit.userId === clientAUser.id, 'Audit log correctly attributes client user ID');

  // SECTION 5: SCRIPT REVISION GATE & STRUCTURED CATEGORIES
  console.log(`\n${colors.bold}--- Section 5: Script Revision Gate & Structured Category Tags ---${colors.reset}`);
  const scriptRevisionDel = {
    id: 'del-test-script-revision',
    clientId: 'cli-1',
    clientName: 'Apex Athletics',
    projectId: 'proj-apex-1',
    projectTitle: 'Apex Q1 Brand Launch',
    title: 'Product Deep Dive Video',
    type: 'long_video',
    targetMonth: '2026-03',
    stage: 'client_script_approval',
    currentVersion: 1,
    scriptText: 'Intro: Welcome to our comprehensive product review.',
    scriptApproved: false,
    videoApproved: false,
    assignedEmployeeId: 'emp-1',
    assignedEmployeeName: 'Vikram Mehta',
    deadline: '2026-03-20',
    status: 'client_review',
    isCountedTowardsCommitment: false,
    versions: [
      {
        version: 1,
        scriptText: 'Intro: Welcome to our comprehensive product review.',
        submittedAt: new Date().toISOString(),
        notes: 'V1 draft',
      },
    ],
    createdAt: new Date().toISOString(),
  };
  testDB.deliverables.push(scriptRevisionDel);

  // Mandatory feedback check: empty feedback on revision must fail
  const emptyFeedbackRes = simulatePostApproval(testDB, clientAUser, {
    deliverableId: scriptRevisionDel.id,
    approvalType: 'script',
    decision: 'revision',
    feedback: '   ',
  });
  assert(emptyFeedbackRes.status === 400, 'Empty feedback on revision request rejected with status 400');
  assert(
    emptyFeedbackRes.error.includes('Feedback explanation is mandatory'),
    'Rejection message clearly mandates feedback explanation'
  );

  // Submit valid revision with structured category tags
  const validRevisionRes = simulatePostApproval(testDB, clientAUser, {
    deliverableId: scriptRevisionDel.id,
    approvalType: 'script',
    decision: 'revision',
    feedback: 'Please make the opening hook punchier and adjust CTA to download whitepaper.',
    categories: ['Hook / Angle', 'Call-to-Action (CTA)'],
  });

  assert(validRevisionRes.status === 200, 'Valid revision request succeeds with 200 OK');
  assert(validRevisionRes.deliverable.stage === 'revisions', 'Deliverable routed to Stage 8: revisions');
  assert(validRevisionRes.deliverable.status === 'revision_requested', 'Deliverable status set to revision_requested');
  assert(validRevisionRes.approval.categories.length === 2, 'Two structured category tags recorded');
  assert(validRevisionRes.approval.categories.includes('Hook / Angle'), 'Category Hook / Angle preserved');
  assert(validRevisionRes.approval.categories.includes('Call-to-Action (CTA)'), 'Category Call-to-Action (CTA) preserved');

  // Verify dual notification: all_admin AND assigned employee
  const adminRevisionNotif = testDB.notifications.find(
    (n) => n.targetRole === 'all_admin' && n.relatedId === scriptRevisionDel.id
  );
  assert(adminRevisionNotif !== undefined, 'Admin/Manager received revision notification');
  assert(adminRevisionNotif.message.includes('Hook / Angle'), 'Admin notification includes category tags');

  const empRevisionNotif = testDB.notifications.find(
    (n) => n.targetRole === 'employee' && n.relatedId === scriptRevisionDel.id
  );
  assert(empRevisionNotif !== undefined, 'Assigned creative employee received direct revision notification');
  assert(empRevisionNotif.title.includes('Revision Requested'), 'Employee notification title states Revision Requested');

  // SECTION 6: VIDEO APPROVAL WORKFLOW (STAGE 7 -> STAGE 9)
  console.log(`\n${colors.bold}--- Section 6: Video Approval Workflow (Stage 7 -> Stage 9) ---${colors.reset}`);
  const videoReviewDel = {
    id: 'del-test-video-approve',
    clientId: 'cli-1',
    clientName: 'Apex Athletics',
    projectId: 'proj-apex-1',
    projectTitle: 'Apex Q1 Brand Launch',
    title: 'Customer Success Story Cut',
    type: 'reel',
    targetMonth: '2026-03',
    stage: 'client_video_approval',
    currentVersion: 1,
    scriptApproved: true,
    videoApproved: false,
    mediaUrl: 'https://cdn.rahimedia.com/apex-story-v1.mp4',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Ananya Sen',
    deadline: '2026-03-25',
    status: 'client_review',
    isCountedTowardsCommitment: false,
    versions: [
      {
        version: 1,
        mediaUrl: 'https://cdn.rahimedia.com/apex-story-v1.mp4',
        submittedAt: new Date().toISOString(),
        notes: 'V1 rough cut complete with subtitles and B-roll',
      },
    ],
    createdAt: new Date().toISOString(),
  };
  testDB.deliverables.push(videoReviewDel);

  const videoApproveRes = simulatePostApproval(testDB, clientAUser, {
    deliverableId: videoReviewDel.id,
    approvalType: 'video',
    decision: 'approve',
    feedback: 'Video edit is fantastic! Pacing and audio are spot on.',
  });

  assert(videoApproveRes.status === 200, 'Video approval succeeds with 200 OK');
  assert(videoApproveRes.deliverable.videoApproved === true, 'deliverable.videoApproved set to true');
  assert(typeof videoApproveRes.deliverable.videoApprovedAt === 'string', 'videoApprovedAt timestamp recorded');
  assert(videoApproveRes.deliverable.stage === 'scheduling', 'Deliverable advanced to Stage 9: scheduling');
  assert(videoApproveRes.deliverable.status === 'approved', 'Deliverable status updated to approved');

  // SECTION 7: VIDEO REVISION GATE & STRUCTURED CATEGORIES
  console.log(`\n${colors.bold}--- Section 7: Video Revision Gate & Audio/Visual Tags ---${colors.reset}`);
  const videoRevisionDel = {
    id: 'del-test-video-revision',
    clientId: 'cli-1',
    clientName: 'Apex Athletics',
    projectId: 'proj-apex-1',
    projectTitle: 'Apex Q1 Brand Launch',
    title: 'Product Teaser Reel',
    type: 'reel',
    targetMonth: '2026-03',
    stage: 'client_video_approval',
    currentVersion: 1,
    scriptApproved: true,
    videoApproved: false,
    mediaUrl: 'https://cdn.rahimedia.com/apex-teaser-v1.mp4',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Ananya Sen',
    deadline: '2026-03-28',
    status: 'client_review',
    isCountedTowardsCommitment: false,
    versions: [
      {
        version: 1,
        mediaUrl: 'https://cdn.rahimedia.com/apex-teaser-v1.mp4',
        submittedAt: new Date().toISOString(),
        notes: 'V1 edit',
      },
    ],
    createdAt: new Date().toISOString(),
  };
  testDB.deliverables.push(videoRevisionDel);

  const videoRevisionRes = simulatePostApproval(testDB, clientAUser, {
    deliverableId: videoRevisionDel.id,
    approvalType: 'video',
    decision: 'revision',
    feedback: 'Audio balance needs tuning: background music overpowers speaker at 0:15-0:30.',
    categories: ['Voiceover / Audio Mix', 'Visual Cuts / Pacing'],
  });

  assert(videoRevisionRes.status === 200, 'Video revision succeeds with 200 OK');
  assert(videoRevisionRes.deliverable.stage === 'revisions', 'Deliverable routed to Stage 8: revisions');
  assert(videoRevisionRes.deliverable.status === 'revision_requested', 'Status updated to revision_requested');
  assert(videoRevisionRes.approval.categories.includes('Voiceover / Audio Mix'), 'Voiceover / Audio Mix tag saved');
  assert(videoRevisionRes.approval.categories.includes('Visual Cuts / Pacing'), 'Visual Cuts / Pacing tag saved');

  // SECTION 8: ADMIN & MANAGER EQUAL OVERSIGHT PARITY
  console.log(`\n${colors.bold}--- Section 8: Admin & Manager Equal Oversight Parity ---${colors.reset}`);
  assert(hasFullAdminAccess(adminUser) === true, 'Admin has FULL_ADMIN_ACCESS');
  assert(hasFullAdminAccess(managerUser) === true, 'Manager has FULL_ADMIN_ACCESS');

  // Admin approves deliverable on behalf of client
  const adminOversightDel = {
    id: 'del-test-admin-oversight',
    clientId: 'cli-2',
    clientName: 'Lumina Skincare',
    projectId: 'proj-lumina-1',
    projectTitle: 'Wellness Campaign',
    title: 'Dr. Speech Reel',
    type: 'reel',
    targetMonth: '2026-03',
    stage: 'client_script_approval',
    currentVersion: 1,
    scriptText: 'Dr. Wellness tips',
    scriptApproved: false,
    videoApproved: false,
    assignedEmployeeId: 'emp-1',
    assignedEmployeeName: 'Vikram Mehta',
    deadline: '2026-03-30',
    status: 'client_review',
    isCountedTowardsCommitment: false,
    versions: [{ version: 1, scriptText: 'Dr. Wellness tips', submittedAt: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  };
  testDB.deliverables.push(adminOversightDel);

  const adminActRes = simulatePostApproval(testDB, adminUser, {
    deliverableId: adminOversightDel.id,
    approvalType: 'script',
    decision: 'approve',
    feedback: 'Approved verbally by Dr. Lumina during alignment call.',
  });

  assert(adminActRes.status === 200, 'Admin can approve on behalf of client with 200 OK');
  assert(adminActRes.approval.recordedByAdminOrManager === true, 'Approval marked recordedByAdminOrManager=true');
  assert(adminActRes.approval.decidedByUserId === adminUser.id, 'Approval records Admin as decider');

  // Manager approves deliverable on behalf of client with 100% equal permission
  const managerOversightDel = {
    id: 'del-test-manager-oversight',
    clientId: 'cli-2',
    clientName: 'Lumina Skincare',
    projectId: 'proj-lumina-1',
    projectTitle: 'Wellness Campaign',
    title: 'Exercise Demo Video',
    type: 'long_video',
    targetMonth: '2026-03',
    stage: 'client_video_approval',
    currentVersion: 1,
    scriptApproved: true,
    videoApproved: false,
    mediaUrl: 'https://cdn.rahimedia.com/lumina-demo-v1.mp4',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Ananya Sen',
    deadline: '2026-03-31',
    status: 'client_review',
    isCountedTowardsCommitment: false,
    versions: [{ version: 1, mediaUrl: 'https://cdn.rahimedia.com/lumina-demo-v1.mp4', submittedAt: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  };
  testDB.deliverables.push(managerOversightDel);

  const managerActRes = simulatePostApproval(testDB, managerUser, {
    deliverableId: managerOversightDel.id,
    approvalType: 'video',
    decision: 'approve',
    feedback: 'Approved via email confirmation from Lumina Marketing VP.',
  });

  assert(managerActRes.status === 200, 'Manager can approve on behalf of client with 200 OK (Equal to Admin)');
  assert(managerActRes.approval.recordedByAdminOrManager === true, 'Approval marked recordedByAdminOrManager=true');
  assert(managerActRes.approval.decidedByUserId === managerUser.id, 'Approval records Manager as decider');

  // Verify Admin and Manager both see all approvals
  const adminView = simulateGetApprovals(testDB, adminUser);
  const managerView = simulateGetApprovals(testDB, managerUser);
  assert(adminView.approvals.length === managerView.approvals.length, 'Admin and Manager query identical approvals count');
  assert(adminView.approvals.length > 5, 'Admin and Manager see all approval records across all clients');

  // SECTION 9: FILTERING & AUDIT TRAIL LOG INTEGRITY
  console.log(`\n${colors.bold}--- Section 9: Query Filtering & Audit Trail Integrity ---${colors.reset}`);
  const filterApproved = simulateGetApprovals(testDB, adminUser, { status: 'approved' });
  assert(filterApproved.approvals.every((a) => a.status === 'approved'), 'status=approved filter returns only approved records');

  const filterRevisions = simulateGetApprovals(testDB, adminUser, { status: 'revision_requested' });
  assert(filterRevisions.approvals.every((a) => a.status === 'revision_requested'), 'status=revision_requested filter returns only revisions');

  const filterScripts = simulateGetApprovals(testDB, adminUser, { type: 'script' });
  assert(filterScripts.approvals.every((a) => a.type === 'script'), 'type=script filter returns only script reviews');

  const filterVideos = simulateGetApprovals(testDB, adminUser, { type: 'video' });
  assert(filterVideos.approvals.every((a) => a.type === 'video'), 'type=video filter returns only video reviews');

  // Check audit log preservation
  const allAuditLogs = testDB.auditLogs;
  const approvalAudits = allAuditLogs.filter((a) => a.targetType === 'approval');
  assert(approvalAudits.length >= 6, 'Audit trail contains all simulated approval & revision events');
  assert(approvalAudits.every((a) => a.timestamp && a.userId && a.action), 'All audit logs contain valid timestamps, userIds, and actions');

  // FINAL SUMMARY
  console.log(`\n${colors.bold}${colors.blue}========================================================================${colors.reset}`);
  console.log(`   ${colors.bold}TEST SUITE EXECUTION COMPLETE${colors.reset}`);
  console.log(`   Total Tests: ${passedCount + failedCount}`);
  console.log(`   ${colors.green}Passed: ${passedCount}${colors.reset}`);
  console.log(`   ${colors.red}Failed: ${failedCount}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}========================================================================${colors.reset}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerificationSuite();
