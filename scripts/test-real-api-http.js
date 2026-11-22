/**
 * RAHI FLOWDESK — REAL API SECURITY & HTTP SESSION INTEGRATION TEST SUITE
 *
 * Performs real network HTTP calls against the live Next.js server (http://127.0.0.1:3000)
 * verifying:
 * 1. Unauthenticated rejection (401) across all protected endpoints.
 * 2. Authenticated sessions via cryptographically secure HttpOnly cookies.
 * 3. Session manipulation & forged token rejection.
 * 4. Admin & Manager equal administrative parity.
 * 5. Employee financial data restrictions & assigned-resource boundaries.
 * 6. Client A and Client B workspace isolation, anti-spoofing, and cross-client action rejection.
 * 7. Client deletion safety: soft-deletion / archiving data preservation.
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

async function loginUser(email) {
  const res = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email }),
  });
  const data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  let cookieHeader = '';
  if (setCookie) {
    const match = setCookie.match(/flowdesk_session=([^;]+)/);
    if (match) cookieHeader = `flowdesk_session=${match[1]}`;
  }
  return { status: res.status, data, cookieHeader };
}

async function runRealHttpSecurityTests() {
  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  RAHI FLOWDESK — REAL API SECURITY & HTTP SESSION TEST SUITE   ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

  // -------------------------------------------------------------
  // [1] UNAUTHENTICATED HTTP REJECTION (401)
  // -------------------------------------------------------------
  console.log(`${colors.bold}[1] UNAUTHENTICATED HTTP REQUESTS (NO COOKIES/TOKENS)${colors.reset}`);

  const unauthGetClients = await fetch(`${BASE_URL}/api/clients`);
  assert(
    unauthGetClients.status === 401,
    'HTTP GET /api/clients without auth returns 401 Unauthorized',
    `Status: ${unauthGetClients.status}`
  );

  const unauthPostClient = await fetch(`${BASE_URL}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Unauth Client', email: 'test@unauth.com' }),
  });
  assert(
    unauthPostClient.status === 401,
    'HTTP POST /api/clients without auth returns 401 Unauthorized',
    `Status: ${unauthPostClient.status}`
  );

  const unauthPutClient = await fetch(`${BASE_URL}/api/clients`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'cli-1', name: 'Tampered' }),
  });
  assert(
    unauthPutClient.status === 401,
    'HTTP PUT /api/clients without auth returns 401 Unauthorized',
    `Status: ${unauthPutClient.status}`
  );

  const unauthDelClient = await fetch(`${BASE_URL}/api/clients?id=cli-1`, { method: 'DELETE' });
  assert(
    unauthDelClient.status === 401,
    'HTTP DELETE /api/clients without auth returns 401 Unauthorized',
    `Status: ${unauthDelClient.status}`
  );

  const unauthGetDeliv = await fetch(`${BASE_URL}/api/deliverables`);
  assert(
    unauthGetDeliv.status === 401,
    'HTTP GET /api/deliverables without auth returns 401 Unauthorized',
    `Status: ${unauthGetDeliv.status}`
  );

  const unauthPostAppr = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliverableId: 'del-101', decision: 'approve' }),
  });
  assert(
    unauthPostAppr.status === 401,
    'HTTP POST /api/approvals without auth returns 401 Unauthorized',
    `Status: ${unauthPostAppr.status}`
  );

  // -------------------------------------------------------------
  // [2] REAL AUTHENTICATION & CRYPTOGRAPHIC SESSION COOKIES
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[2] AUTHENTICATION SESSIONS & HTTPONLY COOKIE GENERATION${colors.reset}`);

  const adminSession = await loginUser('admin@rahicreative.com');
  assert(
    adminSession.status === 200 && adminSession.cookieHeader.startsWith('flowdesk_session='),
    'Admin login generates valid session and flowdesk_session HttpOnly cookie',
    adminSession.cookieHeader.substring(0, 35) + '...'
  );

  const managerSession = await loginUser('manager@rahicreative.com');
  assert(
    managerSession.status === 200 && managerSession.cookieHeader.startsWith('flowdesk_session='),
    'Manager login generates valid session and flowdesk_session HttpOnly cookie',
    managerSession.cookieHeader.substring(0, 35) + '...'
  );

  const employeeSession = await loginUser('editor@rahicreative.com');
  assert(
    employeeSession.status === 200 && employeeSession.cookieHeader.startsWith('flowdesk_session='),
    'Employee login generates valid session and flowdesk_session HttpOnly cookie',
    employeeSession.cookieHeader.substring(0, 35) + '...'
  );

  const clientASession = await loginUser('client.apex@brand.com');
  assert(
    clientASession.status === 200 && clientASession.cookieHeader.startsWith('flowdesk_session='),
    'Client A (Apex) login generates valid session and flowdesk_session HttpOnly cookie',
    clientASession.cookieHeader.substring(0, 35) + '...'
  );

  const clientBSession = await loginUser('client.lumina@skin.com');
  assert(
    clientBSession.status === 200 && clientBSession.cookieHeader.startsWith('flowdesk_session='),
    'Client B (Lumina) login generates valid session and flowdesk_session HttpOnly cookie',
    clientBSession.cookieHeader.substring(0, 35) + '...'
  );

  // -------------------------------------------------------------
  // [3] SESSION MANIPULATION & FORGED TOKEN REJECTION
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[3] SESSION MANIPULATION & FORGED COOKIE REJECTION${colors.reset}`);

  const forgedRes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: 'flowdesk_session=forged_attacker_token_xyz_12345' },
  });
  assert(
    forgedRes.status === 401,
    'Forged session cookie is strictly rejected with 401 Unauthorized',
    `Status: ${forgedRes.status}`
  );

  // Attempt to bypass forged session with query param spoofing
  const bypassAttempt = await fetch(`${BASE_URL}/api/clients?userId=usr-admin`, {
    headers: { Cookie: 'flowdesk_session=forged_attacker_token_xyz_12345' },
  });
  assert(
    bypassAttempt.status === 401,
    'Session anti-tampering: Query param ?userId=usr-admin CANNOT bypass invalid session cookie',
    `Status: ${bypassAttempt.status}`
  );

  // -------------------------------------------------------------
  // [4] ADMIN & MANAGER EQUAL ADMINISTRATIVE PARITY (REAL HTTP)
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[4] ADMIN & MANAGER EQUAL PARITY VIA REAL HTTP${colors.reset}`);

  const adminClientsRes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: adminSession.cookieHeader },
  });
  const adminClients = await adminClientsRes.json();
  const managerClientsRes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: managerSession.cookieHeader },
  });
  const managerClients = await managerClientsRes.json();

  assert(
    adminClientsRes.status === 200 && managerClientsRes.status === 200,
    'Both Admin and Manager sessions receive 200 OK for full client directory'
  );
  assert(
    adminClients.clients.length === managerClients.clients.length,
    'Admin and Manager receive exact identical client lists',
    `${adminClients.clients.length} clients`
  );
  assert(
    adminClients.clients.every((c) => typeof c.monthlyRetainer === 'number') &&
      managerClients.clients.every((c) => typeof c.monthlyRetainer === 'number'),
    'Both Admin and Manager have authorized access to financial retainer data'
  );

  // Real HTTP POST creation by Admin and Manager
  const testClientAdmin = {
    name: `Test Client Admin ${Date.now()}`,
    email: `admin_created_${Date.now()}@test.com`,
    monthlyRetainer: 200000,
    currency: 'INR',
  };
  const adminPostRes = await fetch(`${BASE_URL}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify(testClientAdmin),
  });
  assert(adminPostRes.status === 200, 'Admin can successfully create client via HTTP POST');

  const testClientManager = {
    name: `Test Client Manager ${Date.now()}`,
    email: `mgr_created_${Date.now()}@test.com`,
    monthlyRetainer: 220000,
    currency: 'INR',
  };
  const managerPostRes = await fetch(`${BASE_URL}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify(testClientManager),
  });
  assert(managerPostRes.status === 200, 'Manager can successfully create client via HTTP POST (Parity!)');

  // Real HTTP PUT update by Admin and Manager
  const adminPostData = await adminPostRes.json();
  const managerPostData = await managerPostRes.json();

  const adminPutRes = await fetch(`${BASE_URL}/api/clients`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({ id: adminPostData.client.id, notes: 'Updated by Admin' }),
  });
  assert(adminPutRes.status === 200, 'Admin can successfully update client via HTTP PUT');

  const managerPutRes = await fetch(`${BASE_URL}/api/clients`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({ id: managerPostData.client.id, notes: 'Updated by Manager' }),
  });
  assert(managerPutRes.status === 200, 'Manager can successfully update client via HTTP PUT (Parity!)');

  // -------------------------------------------------------------
  // [5] CLIENT DELETION SAFETY (SOFT DELETION / ARCHIVING)
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[5] CLIENT DELETION SAFETY (SOFT DELETION / ARCHIVAL VERIFICATION)${colors.reset}`);

  const adminDelRes = await fetch(`${BASE_URL}/api/clients?id=${adminPostData.client.id}`, {
    method: 'DELETE',
    headers: { Cookie: adminSession.cookieHeader },
  });
  const adminDelData = await adminDelRes.json();
  assert(
    adminDelRes.status === 200 && adminDelData.client?.status === 'archived',
    'Admin DELETE soft-deletes client: status set to "archived", preserving historical records',
    `Status: ${adminDelData.client?.status}, archivedAt: ${adminDelData.client?.archivedAt}`
  );

  const managerDelRes = await fetch(`${BASE_URL}/api/clients?id=${managerPostData.client.id}`, {
    method: 'DELETE',
    headers: { Cookie: managerSession.cookieHeader },
  });
  const managerDelData = await managerDelRes.json();
  assert(
    managerDelRes.status === 200 && managerDelData.client?.status === 'archived',
    'Manager DELETE soft-deletes client: status set to "archived" (Equal Administrative Parity!)',
    `Status: ${managerDelData.client?.status}`
  );

  // -------------------------------------------------------------
  // [6] EMPLOYEE BOUNDARIES & FINANCIAL DATA RESTRICTIONS
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[6] EMPLOYEE FINANCIAL RESTRICTIONS & ASSIGNED BOUNDARY${colors.reset}`);

  const empClientsRes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: employeeSession.cookieHeader },
  });
  const empClients = await empClientsRes.json();

  assert(
    empClientsRes.status === 200,
    'Employee receives 200 OK for authorized client directory'
  );
  assert(
    empClients.clients.every((c) => c.monthlyRetainer === undefined && c.currency === undefined),
    'Employee boundary verified: All monthly retainers and currencies are strictly stripped',
    'monthlyRetainer: undefined across all records'
  );
  assert(
    empClients.clients.some((c) => c.id === 'cli-1') && !empClients.clients.some((c) => c.id === 'cli-3'),
    'Employee assigned resource boundary: Vikram sees assigned Apex, but is strictly blocked from unassigned FinTech Pulse',
    `Returned: ${empClients.clients.map(c => c.name).join(', ')}`
  );

  const empPostAttempt = await fetch(`${BASE_URL}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({ name: 'Hacked Client' }),
  });
  assert(
    empPostAttempt.status === 403,
    'Employee POST /api/clients is strictly rejected with 403 Forbidden',
    `Status: ${empPostAttempt.status}`
  );

  const empPutAttempt = await fetch(`${BASE_URL}/api/clients`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({ id: 'cli-1', name: 'Hacked' }),
  });
  assert(
    empPutAttempt.status === 403,
    'Employee PUT /api/clients is strictly rejected with 403 Forbidden',
    `Status: ${empPutAttempt.status}`
  );

  const empDelAttempt = await fetch(`${BASE_URL}/api/clients?id=cli-1`, {
    method: 'DELETE',
    headers: { Cookie: employeeSession.cookieHeader },
  });
  assert(
    empDelAttempt.status === 403,
    'Employee DELETE /api/clients is strictly rejected with 403 Forbidden',
    `Status: ${empDelAttempt.status}`
  );

  // -------------------------------------------------------------
  // [7] CLIENT A & CLIENT B WORKSPACE ISOLATION & ANTI-SPOOFING
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[7] CLIENT A & CLIENT B WORKSPACE ISOLATION & ANTI-SPOOFING${colors.reset}`);

  // Client A directory request
  const clientARes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  const clientAData = await clientARes.json();
  assert(
    clientARes.status === 200 &&
      clientAData.clients.length === 1 &&
      clientAData.clients[0].id === 'cli-1',
    'Client A session receives ONLY their own organization profile (Apex Athletics)',
    `Returned: ${clientAData.clients[0]?.name}`
  );

  // Client A attempts parameter spoofing (?clientId=cli-2)
  const clientASpoofRes = await fetch(`${BASE_URL}/api/clients?clientId=cli-2`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  const clientASpoofData = await clientASpoofRes.json();
  assert(
    clientASpoofData.clients.length === 1 && clientASpoofData.clients[0].id === 'cli-1',
    'Anti-Spoofing: Client A querying ?clientId=cli-2 is strictly bound to own org cli-1',
    'Server ignored query parameter and enforced session clientId'
  );

  // Client B directory request
  const clientBRes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: clientBSession.cookieHeader },
  });
  const clientBData = await clientBRes.json();
  assert(
    clientBRes.status === 200 &&
      clientBData.clients.length === 1 &&
      clientBData.clients[0].id === 'cli-2',
    'Client B session receives ONLY their own organization profile (Lumina Skincare)',
    `Returned: ${clientBData.clients[0]?.name}`
  );

  // Client A deliverables request
  const clientADelivRes = await fetch(`${BASE_URL}/api/deliverables`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  const clientADeliv = await clientADelivRes.json();
  assert(
    clientADelivRes.status === 200 &&
      clientADeliv.deliverables.every((d) => d.clientId === 'cli-1'),
    'Client A receives ONLY deliverables belonging to cli-1 (Apex Athletics)',
    `${clientADeliv.deliverables.length} deliverables returned`
  );

  // Client A attempts to request Client B deliverables (?clientId=cli-2)
  const clientASpoofDelivRes = await fetch(`${BASE_URL}/api/deliverables?clientId=cli-2`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  const clientASpoofDeliv = await clientASpoofDelivRes.json();
  assert(
    clientASpoofDeliv.deliverables.every((d) => d.clientId === 'cli-1'),
    'Anti-Spoofing: Client A querying ?clientId=cli-2 deliverables is strictly restricted to cli-1',
    'Zero cross-client deliverable exposure'
  );

  // Client B deliverables request
  const clientBDelivRes = await fetch(`${BASE_URL}/api/deliverables`, {
    headers: { Cookie: clientBSession.cookieHeader },
  });
  const clientBDeliv = await clientBDelivRes.json();
  assert(
    clientBDelivRes.status === 200 &&
      clientBDeliv.deliverables.every((d) => d.clientId === 'cli-2'),
    'Client B receives ONLY deliverables belonging to cli-2 (Lumina Skincare)',
    `${clientBDeliv.deliverables.length} deliverables returned`
  );

  // Cross-client mutations by Client A
  const clientAPutOther = await fetch(`${BASE_URL}/api/clients`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookieHeader },
    body: JSON.stringify({ id: 'cli-2', name: 'Tampered Lumina' }),
  });
  assert(
    clientAPutOther.status === 403,
    'Client A attempting PUT /api/clients on Client B is rejected with 403 Forbidden',
    `Status: ${clientAPutOther.status}`
  );

  const clientADelOther = await fetch(`${BASE_URL}/api/clients?id=cli-2`, {
    method: 'DELETE',
    headers: { Cookie: clientASession.cookieHeader },
  });
  assert(
    clientADelOther.status === 403,
    'Client A attempting DELETE /api/clients on Client B is rejected with 403 Forbidden',
    `Status: ${clientADelOther.status}`
  );

  // Cross-client approval: Client A tries to approve a deliverable belonging to Lumina (del-201)
  const crossApprRes = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookieHeader },
    body: JSON.stringify({ deliverableId: 'del-201', approvalType: 'video', decision: 'approve' }),
  });
  assert(
    crossApprRes.status === 403,
    'Cross-client approval action: Client A attempting to approve Client B deliverable is rejected with 403 Forbidden',
    `Status: ${crossApprRes.status}`
  );

  // -------------------------------------------------------------
  // [8] PHASE 4: EMPLOYEE & TASK MANAGEMENT HTTP INTEGRATION TESTS
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[8] PHASE 4: EMPLOYEE & TASK MANAGEMENT HTTP VERIFICATION${colors.reset}`);

  // 1. Unauthenticated checks for employees & tasks
  const unauthGetEmp = await fetch(`${BASE_URL}/api/employees`);
  assert(
    unauthGetEmp.status === 401,
    'HTTP GET /api/employees without auth returns 401 Unauthorized',
    `Status: ${unauthGetEmp.status}`
  );

  const unauthGetTasks = await fetch(`${BASE_URL}/api/tasks`);
  assert(
    unauthGetTasks.status === 401,
    'HTTP GET /api/tasks without auth returns 401 Unauthorized',
    `Status: ${unauthGetTasks.status}`
  );

  const unauthPostTask = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', title: 'Unauth Task' }),
  });
  assert(
    unauthPostTask.status === 401,
    'HTTP POST /api/tasks without auth returns 401 Unauthorized',
    `Status: ${unauthPostTask.status}`
  );

  // 2. Admin & Manager Parity on Employees
  const adminGetEmp = await fetch(`${BASE_URL}/api/employees`, {
    headers: { Cookie: adminSession.cookieHeader },
  });
  const adminEmpData = await adminGetEmp.json();
  assert(adminGetEmp.status === 200, 'Admin session GET /api/employees returns 200 OK');

  const managerGetEmp = await fetch(`${BASE_URL}/api/employees`, {
    headers: { Cookie: managerSession.cookieHeader },
  });
  const managerEmpData = await managerGetEmp.json();
  assert(managerGetEmp.status === 200, 'Manager session GET /api/employees returns 200 OK');
  assert(
    adminEmpData.employees.length === managerEmpData.employees.length,
    'Admin and Manager receive exact identical employee roster over HTTP',
    `Count: ${adminEmpData.employees.length}`
  );

  // 3. Admin & Manager Parity on Tasks
  const adminGetTasks = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: adminSession.cookieHeader },
  });
  const adminTasksData = await adminGetTasks.json();
  assert(adminGetTasks.status === 200, 'Admin session GET /api/tasks returns 200 OK');

  const managerGetTasks = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: managerSession.cookieHeader },
  });
  const managerTasksData = await managerGetTasks.json();
  assert(managerGetTasks.status === 200, 'Manager session GET /api/tasks returns 200 OK');
  assert(
    adminTasksData.tasks.length === managerTasksData.tasks.length,
    'Admin and Manager receive exact identical company-wide task list over HTTP',
    `Count: ${adminTasksData.tasks.length}`
  );

  // 4. Admin & Manager Task Creation Parity
  const adminCreateTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({
      action: 'create',
      title: 'HTTP Task Created by Admin',
      clientId: 'cli-1',
      assignedEmployeeId: 'emp-1',
      priority: 'high',
      deadline: '2026-11-30',
    }),
  });
  const adminCreateTaskData = await adminCreateTaskRes.json();
  assert(adminCreateTaskRes.status === 200, 'Admin can create task via HTTP POST');

  const managerCreateTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({
      action: 'create',
      title: 'HTTP Task Created by Manager',
      clientId: 'cli-1',
      assignedEmployeeId: 'emp-2',
      priority: 'urgent',
      deadline: '2026-11-29',
    }),
  });
  const managerCreateTaskData = await managerCreateTaskRes.json();
  assert(managerCreateTaskRes.status === 200, 'Manager can create task via HTTP POST (Parity Verified!)');

  // 5. Task Reassignment via HTTP PUT by Manager
  const reassignRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({
      taskId: adminCreateTaskData.task.id,
      assignedEmployeeId: 'emp-3',
      priority: 'urgent',
    }),
  });
  const reassignData = await reassignRes.json();
  assert(reassignRes.status === 200, 'Manager can reassign task via HTTP PUT (Parity Verified!)');
  assert(reassignData.task.assignedEmployeeId === 'emp-3', 'Task assignedEmployeeId updated to Kabir Joshi (emp-3)');

  // 6. Employee Boundary Checks
  const empGetEmp = await fetch(`${BASE_URL}/api/employees`, {
    headers: { Cookie: employeeSession.cookieHeader },
  });
  const empEmpData = await empGetEmp.json();
  assert(empGetEmp.status === 200, 'Employee session GET /api/employees returns 200 OK');
  assert(
    empEmpData.employees.every((e) => e.performanceScore === undefined),
    'Employee HTTP view: Performance scores strictly stripped across all records'
  );

  const empGetTasks = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: employeeSession.cookieHeader },
  });
  const empTasksData = await empGetTasks.json();
  assert(empGetTasks.status === 200, 'Employee session GET /api/tasks returns 200 OK');
  assert(
    empTasksData.tasks.every(
      (t) =>
        t.assignedEmployeeId === 'emp-1' ||
        t.assignedEmployeeId === 'usr-emp-1' ||
        t.assignedEmployeeName.toLowerCase() === 'vikram mehta'
    ),
    'Employee HTTP task boundary: Employee strictly receives ONLY tasks assigned to them',
    `Returned: ${empTasksData.tasks.length} tasks`
  );

  // Employee mutation blocks
  const empPostEmp = await fetch(`${BASE_URL}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({ name: 'Tampered Emp', email: 'tampered@emp.com' }),
  });
  assert(empPostEmp.status === 403, 'Employee POST /api/employees is strictly rejected with 403 Forbidden');

  const empPostTask = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({ action: 'create', title: 'Unauthorized Task' }),
  });
  assert(empPostTask.status === 403, 'Employee POST /api/tasks (action: create) is strictly rejected with 403 Forbidden');

  const empPutTask = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({ taskId: adminCreateTaskData.task.id, priority: 'low' }),
  });
  assert(empPutTask.status === 403, 'Employee PUT /api/tasks is strictly rejected with 403 Forbidden');

  // 7. Client Role Restrictions
  const clientGetEmp = await fetch(`${BASE_URL}/api/employees`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  assert(clientGetEmp.status === 403, 'Client GET /api/employees is strictly rejected with 403 Forbidden');

  const clientGetTasks = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  assert(clientGetTasks.status === 403, 'Client GET /api/tasks is strictly rejected with 403 Forbidden');

  // -------------------------------------------------------------
  // [9] PHASE 5: 10-STAGE PIPELINE & MULTI-VERSION HTTP TESTS
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[9] PHASE 5: 10-STAGE PIPELINE & MULTI-VERSION HTTP VERIFICATION${colors.reset}`);

  // 1. Admin creates deliverable via HTTP POST at Stage 1
  const adminCreateDelRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({
      action: 'create',
      title: 'Real HTTP Pipeline Test Reel',
      clientId: 'cli-1',
      type: 'reel',
      targetMonth: '2026-11',
      assignedEmployeeId: 'emp-1',
      deadline: '2026-11-30',
      scriptText: 'Initial hook draft v1',
    }),
  });
  const adminCreateDelData = await adminCreateDelRes.json();
  assert(adminCreateDelRes.status === 200, 'Admin can create deliverable at Stage 1 via HTTP POST');
  assert(adminCreateDelData.deliverable.stage === 'content_planning', 'Deliverable starts at Stage 1 (content_planning)');
  assert(adminCreateDelData.deliverable.currentVersion === 1, 'Deliverable starts at Version 1');
  assert(adminCreateDelData.deliverable.isCountedTowardsCommitment === false, 'Stage 1 deliverable isCountedTowardsCommitment = false');

  const testDelId = adminCreateDelData.deliverable.id;

  // 2. Manager advances deliverable from Stage 1 -> Stage 2 -> Stage 3 (Parity Verified!)
  const mgrAdvanceRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: testDelId,
      stage: 'internal_script_review',
      status: 'internal_review',
    }),
  });
  const mgrAdvanceData = await mgrAdvanceRes.json();
  assert(mgrAdvanceRes.status === 200, 'Manager can advance deliverable stage via HTTP POST (Parity Verified!)');
  assert(mgrAdvanceData.deliverable.stage === 'internal_script_review', 'Deliverable advanced to Stage 3 (internal_script_review)');

  // 3. Admin advances deliverable to Stage 4 (client_script_approval)
  const adminToStage4Res = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: testDelId,
      stage: 'client_script_approval',
    }),
  });
  assert(adminToStage4Res.status === 200, 'Admin advances deliverable to Stage 4 (client_script_approval)');

  // 4. Cross-Client Block: Client B attempts to decide on Client A deliverable
  const clientBCrossAppr = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientBSession.cookieHeader },
    body: JSON.stringify({
      action: 'client_approval',
      deliverableId: testDelId,
      type: 'script',
      decision: 'approve',
    }),
  });
  assert(
    clientBCrossAppr.status === 403,
    'Cross-client approval action: Client B attempting to approve Client A deliverable is strictly rejected with 403 Forbidden',
    `Status: ${clientBCrossAppr.status}`
  );

  // 5. Client A approves script -> advances to Stage 5 (video_editing)
  const clientAApprScript = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookieHeader },
    body: JSON.stringify({
      action: 'client_approval',
      deliverableId: testDelId,
      type: 'script',
      decision: 'approve',
      feedback: 'Great hook! Script approved.',
    }),
  });
  const clientAApprScriptData = await clientAApprScript.json();
  assert(clientAApprScript.status === 200, 'Client A approves own script via HTTP POST');
  assert(clientAApprScriptData.deliverable.scriptApproved === true, 'Deliverable scriptApproved set to true');
  assert(clientAApprScriptData.deliverable.stage === 'video_editing', 'Script approval automatically advances deliverable to Stage 5 (video_editing)');

  // 6. Employee uploads Version 2 (Rough Cut Media)
  const empUploadVerRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({
      action: 'upload_version',
      deliverableId: testDelId,
      mediaUrl: 'https://cdn.test.com/rough_cut_v2.mp4',
      notes: 'Rough cut with color grade and audio mix',
    }),
  });
  const empUploadVerData = await empUploadVerRes.json();
  assert(empUploadVerRes.status === 200, 'Assigned Employee uploads Version 2 via HTTP POST');
  assert(empUploadVerData.deliverable.currentVersion === 2, 'Deliverable currentVersion incremented to 2');
  assert(empUploadVerData.deliverable.versions.length === 2, 'Deliverable versions array contains exactly 2 records');

  // 7. Manager advances deliverable to Stage 7 (client_video_approval)
  const mgrToStage7 = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: testDelId,
      stage: 'client_video_approval',
    }),
  });
  assert(mgrToStage7.status === 200, 'Manager advances deliverable to Stage 7 (client_video_approval) (Parity Verified!)');

  // 8. Client A requests revision on video -> routes to Stage 8 (revisions)
  const clientARevVideo = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookieHeader },
    body: JSON.stringify({
      action: 'client_approval',
      deliverableId: testDelId,
      type: 'video',
      decision: 'revision',
      feedback: 'Please change music track and trim final 3 seconds',
    }),
  });
  const clientARevVideoData = await clientARevVideo.json();
  assert(clientARevVideo.status === 200, 'Client A requests revision via HTTP POST');
  assert(clientARevVideoData.deliverable.stage === 'revisions', 'Client revision request routes deliverable to Stage 8 (revisions)');
  assert(clientARevVideoData.deliverable.status === 'revision_requested', 'Deliverable status set to revision_requested');

  // 9. Employee uploads Version 3 (Revised Master Cut) -> auto routes to internal review
  const empUploadVer3 = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({
      action: 'upload_version',
      deliverableId: testDelId,
      mediaUrl: 'https://cdn.test.com/revised_master_v3.mp4',
      notes: 'Trimmed outro and updated soundtrack',
    }),
  });
  const empUploadVer3Data = await empUploadVer3.json();
  assert(empUploadVer3.status === 200, 'Employee uploads Version 3 via HTTP POST');
  assert(empUploadVer3Data.deliverable.currentVersion === 3, 'Deliverable currentVersion incremented to 3');
  assert(empUploadVer3Data.deliverable.stage === 'internal_video_review', 'Revisions upload automatically re-enters internal review');

  // 10. Manager finalizes deliverable at Stage 10 (Publishing & Final Delivery)
  const mgrDeliverRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: testDelId,
      stage: 'publishing_or_delivery',
      status: 'published',
    }),
  });
  const mgrDeliverData = await mgrDeliverRes.json();
  assert(mgrDeliverRes.status === 200, 'Manager publishes deliverable at Stage 10 via HTTP POST (Parity Verified!)');
  assert(mgrDeliverData.deliverable.stage === 'publishing_or_delivery', 'Deliverable at Stage 10 (publishing_or_delivery)');
  assert(mgrDeliverData.deliverable.isCountedTowardsCommitment === true, 'STAGE 10 COMMITMENT RULE VERIFIED: isCountedTowardsCommitment = true');

  // 11. Admin soft-cancels another deliverable with reason
  const adminCancelRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({
      action: 'cancel',
      deliverableId: testDelId,
      reason: 'Campaign postponed by client',
    }),
  });
  const adminCancelData = await adminCancelRes.json();
  assert(adminCancelRes.status === 200, 'Admin can cancel deliverable via HTTP POST');
  assert(adminCancelData.deliverable.status === 'cancelled', 'Cancelled deliverable status = "cancelled"');
  assert(adminCancelData.deliverable.isCountedTowardsCommitment === false, 'Cancelled deliverable strictly isCountedTowardsCommitment = false');
  assert(adminCancelData.deliverable.cancellationReason === 'Campaign postponed by client', 'Cancellation reason preserved');

  // -------------------------------------------------------------
  // SECTION 10: PHASE 6 CLIENT REVIEW & APPROVAL CENTER HTTP TESTS
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}--- Section 10: Phase 6 Client Review, Feedback & Approval Center HTTP Security ---${colors.reset}`);

  // Create a dedicated Stage 4 deliverable for Client A (Apex Athletics, cli-1)
  const p6CreateRes = await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({
      action: 'create',
      clientId: 'cli-1',
      projectId: 'proj-1',
      title: 'Phase 6 Live HTTP Approval Reel',
      type: 'reel',
      targetMonth: '2026-03',
      deadline: '2026-03-31',
      assignedEmployeeId: 'emp-1',
    }),
  });
  const p6CreateData = await p6CreateRes.json();
  assert(p6CreateRes.status === 200, 'Admin creates Phase 6 test deliverable via HTTP POST');
  const p6DelId = p6CreateData.deliverable.id;

  // Advance deliverable to Stage 4 (client_script_approval)
  await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: p6DelId,
      stage: 'client_script_approval',
      status: 'client_review',
      scriptText: 'Live HTTP Script: Accelerate your brand narrative with RAHI Creative Media.',
    }),
  });

  // 1. Employee attempt to submit client approval over HTTP -> 403 Forbidden
  const empApproveAttempt = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: employeeSession.cookieHeader },
    body: JSON.stringify({
      deliverableId: p6DelId,
      approvalType: 'script',
      decision: 'approve',
      feedback: 'Employee trying to approve',
    }),
  });
  const empApproveAttemptData = await empApproveAttempt.json();
  assert(empApproveAttempt.status === 403, 'Employee attempting client approval rejected with 403 Forbidden over HTTP');
  assert(
    empApproveAttemptData.error.includes('Employees cannot submit client approvals'),
    'HTTP response explicitly states employees cannot submit client approvals'
  );

  // 2. Client B attempt to approve Client A deliverable over HTTP -> 403 Forbidden
  const clientBCrossApprove = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientBSession.cookieHeader },
    body: JSON.stringify({
      deliverableId: p6DelId,
      approvalType: 'script',
      decision: 'approve',
      feedback: 'Client B rogue approval attempt',
    }),
  });
  const clientBCrossData = await clientBCrossApprove.json();
  assert(clientBCrossApprove.status === 403, 'Client B cross-client approval attempt rejected with 403 Forbidden over HTTP');
  assert(
    clientBCrossData.error.includes('Cross-client approval actions are strictly blocked'),
    'Cross-client isolation enforced over HTTP'
  );

  // 3. Mandatory feedback enforcement over HTTP
  const emptyFeedbackHttp = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookieHeader },
    body: JSON.stringify({
      deliverableId: p6DelId,
      approvalType: 'script',
      decision: 'revision',
      feedback: '   ',
    }),
  });
  const emptyFeedbackHttpData = await emptyFeedbackHttp.json();
  assert(emptyFeedbackHttp.status === 400, 'Empty feedback on revision request rejected with status 400 over HTTP');
  assert(
    emptyFeedbackHttpData.error.includes('Feedback explanation is mandatory'),
    'HTTP error enforces mandatory feedback explanation'
  );

  // 4. Client A submits script revision request with structured category tags over HTTP
  const clientARevisionHttp = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientASession.cookieHeader },
    body: JSON.stringify({
      deliverableId: p6DelId,
      approvalType: 'script',
      decision: 'revision',
      feedback: 'Please refine tone of voice in line 2 and strengthen call to action.',
      categories: ['Brand Tone / Voice', 'Call-to-Action (CTA)'],
    }),
  });
  const clientARevisionData = await clientARevisionHttp.json();
  assert(clientARevisionHttp.status === 200, 'Client A submits revision request with tags via HTTP POST');
  assert(clientARevisionData.deliverable.stage === 'revisions', 'Deliverable routed to Stage 8 (revisions) over HTTP');
  assert(clientARevisionData.deliverable.status === 'revision_requested', 'Deliverable status set to revision_requested');
  assert(clientARevisionData.approval.categories.length === 2, 'Structured category tags saved in approval record');
  assert(clientARevisionData.approval.categories.includes('Brand Tone / Voice'), 'Brand Tone / Voice tag verified');

  // 5. Manager records client approval oversight over HTTP (Full Administrative Access Parity)
  const mgrOversightHttp = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: managerSession.cookieHeader },
    body: JSON.stringify({
      deliverableId: p6DelId,
      approvalType: 'script',
      decision: 'approve',
      feedback: 'Approved verbally by Client A Founder during review call.',
    }),
  });
  const mgrOversightData = await mgrOversightHttp.json();
  assert(mgrOversightHttp.status === 200, 'Manager can record client approval oversight via HTTP POST');
  assert(mgrOversightData.approval.recordedByAdminOrManager === true, 'Approval marked recordedByAdminOrManager=true over HTTP');
  assert(mgrOversightData.deliverable.scriptApproved === true, 'deliverable.scriptApproved updated to true over HTTP');
  assert(mgrOversightData.deliverable.stage === 'video_editing', 'Deliverable advanced to Stage 5 (video_editing) over HTTP');

  // 6. Admin records video approval oversight over HTTP (Equal to Manager)
  // First advance to Stage 7 (client_video_approval)
  await fetch(`${BASE_URL}/api/deliverables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({
      action: 'update_stage',
      deliverableId: p6DelId,
      stage: 'client_video_approval',
      status: 'client_review',
      mediaUrl: 'https://cdn.test.com/phase6_video_cut.mp4',
    }),
  });

  const adminVideoApproveHttp = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminSession.cookieHeader },
    body: JSON.stringify({
      deliverableId: p6DelId,
      approvalType: 'video',
      decision: 'approve',
      feedback: 'Final video approved for release.',
    }),
  });
  const adminVideoApproveData = await adminVideoApproveHttp.json();
  assert(adminVideoApproveHttp.status === 200, 'Admin can record video approval oversight via HTTP POST');
  assert(adminVideoApproveData.approval.recordedByAdminOrManager === true, 'Admin approval marked recordedByAdminOrManager=true');
  assert(adminVideoApproveData.deliverable.videoApproved === true, 'deliverable.videoApproved set to true over HTTP');
  assert(adminVideoApproveData.deliverable.stage === 'scheduling', 'Deliverable advanced to Stage 9 (scheduling) over HTTP');

  // 7. Client A queries GET /api/approvals over HTTP -> strict isolation
  const clientAGetHttp = await fetch(`${BASE_URL}/api/approvals`, {
    headers: { Cookie: clientASession.cookieHeader },
  });
  const clientAGetData = await clientAGetHttp.json();
  assert(clientAGetHttp.status === 200, 'Client A queries GET /api/approvals over HTTP');
  assert(
    clientAGetData.approvals.every((a) => a.clientId === 'cli-1'),
    'Client A approvals query returns ONLY cli-1 records (Cross-Client Data Leak Impossible!)'
  );

  // 8. Admin queries GET /api/approvals with query filters over HTTP
  const adminGetFilteredHttp = await fetch(`${BASE_URL}/api/approvals?status=approved`, {
    headers: { Cookie: adminSession.cookieHeader },
  });
  const adminGetFilteredData = await adminGetFilteredHttp.json();
  assert(adminGetFilteredHttp.status === 200, 'Admin queries filtered approvals over HTTP');
  assert(
    adminGetFilteredData.approvals.every((a) => a.status === 'approved'),
    'Filtered approvals query strictly returns status=approved'
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}  REAL HTTP SECURITY TEST RESULTS: ${colors.green}${passed} PASSED${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} FAILED${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRealHttpSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
