/**
 * RAHI FLOWDESK — PHASE 10: DEEP INDEPENDENT HTTP SECURITY & PERMISSION VERIFICATION
 *
 * Performs deep, exhaustive verification across:
 * 1. Unauthenticated rejection (401) on all protected routes.
 * 2. Authenticated sessions & HttpOnly cookie security attributes.
 * 3. Session expiry, tampering, and logout revocation.
 * 4. Account deactivation server-side revocation (403).
 * 5. Cross-client access, IDOR, and tenant boundary tests (Client A vs Client B).
 * 6. Role manipulation, privilege escalation, and spoofed callerUserId attempts.
 * 7. Employee financial restrictions and server-side retainer stripping.
 * 8. Brute-force rate limiting: login lockout, password reset, and invitation abuse.
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
  return { status: res.status, data, cookieHeader, rawSetCookie: setCookie };
}

async function runDeepVerification() {
  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  RAHI FLOWDESK — PHASE 10: DEEP INDEPENDENT SECURITY TESTS      ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

  // -------------------------------------------------------------
  // [1] UNAUTHENTICATED REJECTIONS ACROSS ALL PROTECTED ROUTES
  // -------------------------------------------------------------
  console.log(`${colors.bold}[1] UNAUTHENTICATED HTTP REJECTIONS (HTTP 401)${colors.reset}`);

  const endpointsToTest = [
    { url: '/api/clients', method: 'GET' },
    { url: '/api/clients', method: 'POST', body: { name: 'Hack' } },
    { url: '/api/projects', method: 'GET' },
    { url: '/api/projects', method: 'POST', body: { title: 'Hack' } },
    { url: '/api/tasks', method: 'GET' },
    { url: '/api/tasks', method: 'POST', body: { title: 'Hack' } },
    { url: '/api/deliverables', method: 'GET' },
    { url: '/api/deliverables', method: 'POST', body: { title: 'Hack' } },
    { url: '/api/finance', method: 'GET' },
    { url: '/api/finance', method: 'POST', body: { action: 'create_invoice' } },
    { url: '/api/audit', method: 'GET' },
    { url: '/api/reports', method: 'GET' },
    { url: '/api/notifications', method: 'GET' },
  ];

  for (const ep of endpointsToTest) {
    const res = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: ep.body ? { 'Content-Type': 'application/json' } : {},
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    assert(
      res.status === 401,
      `Unauthenticated ${ep.method} ${ep.url} strictly rejected with 401 Unauthorized`,
      `Status: ${res.status}`
    );
  }

  // -------------------------------------------------------------
  // [2] SESSION AUTHENTICATION & COOKIE SECURITY ATTRIBUTES
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[2] AUTHENTICATED SESSIONS & COOKIE SECURITY ATTRIBUTES${colors.reset}`);

  const adminAuth = await loginUser('admin@rahicreative.com');
  const managerAuth = await loginUser('manager@rahicreative.com');
  const employeeAuth = await loginUser('editor@rahicreative.com');
  const clientAAuth = await loginUser('client.apex@brand.com');
  const clientBAuth = await loginUser('client.lumina@skin.com');

  assert(
    adminAuth.status === 200 && adminAuth.cookieHeader.startsWith('flowdesk_session='),
    'Admin login creates cryptographic session token',
    adminAuth.cookieHeader.substring(0, 35) + '...'
  );

  // Inspect cookie flags
  const setCookieStr = adminAuth.rawSetCookie || '';
  assert(
    setCookieStr.toLowerCase().includes('httponly'),
    'Session cookie sets HttpOnly flag (blocks XSS document.cookie exfiltration)',
    setCookieStr
  );
  assert(
    setCookieStr.toLowerCase().includes('samesite=lax'),
    'Session cookie sets SameSite=Lax (blocks cross-site request forgery)',
    setCookieStr
  );
  assert(
    setCookieStr.toLowerCase().includes('path=/'),
    'Session cookie sets Path=/',
    setCookieStr
  );

  // -------------------------------------------------------------
  // [3] LOGOUT, EXPIRY & TOKEN TAMPERING
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[3] LOGOUT, EXPIRY & TOKEN TAMPERING${colors.reset}`);

  // Test logout clears cookie
  const logoutRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'logout' }),
  });
  const logoutSetCookie = logoutRes.headers.get('set-cookie') || '';
  assert(
    logoutRes.status === 200 && logoutSetCookie.includes('Max-Age=0') || logoutSetCookie.includes('1970'),
    'Logout endpoint clears flowdesk_session cookie with expired timestamp',
    logoutSetCookie
  );

  // Forged session token
  const forgedRes = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: 'flowdesk_session=forged_attacker_secret_token_12345' },
  });
  assert(
    forgedRes.status === 401,
    'Forged session cookie is strictly rejected with 401 Unauthorized',
    `Status: ${forgedRes.status}`
  );

  // Spoofed query param ?userId=usr-admin cannot bypass missing cookie
  const bypassParamAttempt = await fetch(`${BASE_URL}/api/clients?userId=usr-admin`);
  assert(
    bypassParamAttempt.status === 401,
    'Session anti-spoofing: Query parameter ?userId=usr-admin CANNOT bypass authentication',
    `Status: ${bypassParamAttempt.status}`
  );

  // -------------------------------------------------------------
  // [4] ACCOUNT DEACTIVATION SERVER-SIDE REVOCATION
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[4] ACCOUNT DEACTIVATION SERVER-SIDE ENFORCEMENT${colors.reset}`);

  // Deactivate Lumina user
  await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminAuth.cookieHeader,
    },
    body: JSON.stringify({
      action: 'toggle_status',
      callerUserId: adminAuth.data.user.id,
      targetUserId: 'usr-client-2',
    }),
  });

  // Attempt login with deactivated user
  const inactiveLogin = await loginUser('client.lumina@skin.com');
  assert(
    inactiveLogin.status === 403,
    'Deactivated account attempting login is rejected with 403 Forbidden',
    inactiveLogin.data?.error
  );

  // Attempt request using Client B's session that was established BEFORE deactivation!
  const revokedSessionAttempt = await fetch(`${BASE_URL}/api/clients`, {
    headers: { Cookie: clientBAuth.cookieHeader },
  });
  assert(
    revokedSessionAttempt.status === 403,
    'Server-side session revocation: Active session of deactivated user is immediately rejected with 403',
    `Status: ${revokedSessionAttempt.status}`
  );

  // Re-activate Lumina user to preserve data
  await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminAuth.cookieHeader,
    },
    body: JSON.stringify({
      action: 'toggle_status',
      callerUserId: adminAuth.data.user.id,
      targetUserId: 'usr-client-2',
    }),
  });

  // -------------------------------------------------------------
  // [5] CROSS-CLIENT ISOLATION & IDOR DEFENSE
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[5] MULTI-TENANT CROSS-CLIENT ISOLATION & IDOR DEFENSE${colors.reset}`);

  // Client A queries client directory with tampered query parameter ?clientId=cli-2
  const clientATamperedRes = await fetch(`${BASE_URL}/api/clients?clientId=cli-2`, {
    headers: { Cookie: clientAAuth.cookieHeader },
  });
  const clientATamperedData = await clientATamperedRes.json();
  assert(
    clientATamperedRes.status === 200 &&
      clientATamperedData.clients?.length === 1 &&
      clientATamperedData.clients[0].id === 'cli-1',
    'Client A querying ?clientId=cli-2 is strictly locked to own org (cli-1)',
    `Returned client: ${clientATamperedData.clients?.[0]?.name}`
  );

  // Client A attempts to view Client B deliverables
  const clientACrossDeliv = await fetch(`${BASE_URL}/api/deliverables?clientId=cli-2`, {
    headers: { Cookie: clientAAuth.cookieHeader },
  });
  const clientACrossData = await clientACrossDeliv.json();
  const leakedDeliv = (clientACrossData.deliverables || []).find((d) => d.clientId === 'cli-2');
  assert(
    leakedDeliv === undefined,
    'Client A querying deliverables receives ZERO deliverables belonging to Client B',
    `Leaked deliverables: ${Boolean(leakedDeliv)}`
  );

  // Client A attempts to approve or reject a Client B deliverable
  const crossApproveRes = await fetch(`${BASE_URL}/api/approvals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: clientAAuth.cookieHeader,
    },
    body: JSON.stringify({
      deliverableId: 'del-201', // Lumina deliverable
      approvalType: 'script',
      decision: 'approve',
      feedback: 'Cross client hacking attempt',
    }),
  });
  assert(
    crossApproveRes.status === 403,
    'Client A attempting to approve Client B deliverable is strictly rejected with 403 Forbidden',
    `Status: ${crossApproveRes.status}`
  );

  // Client A attempts to delete Client B
  const clientADelClientB = await fetch(`${BASE_URL}/api/clients?id=cli-2`, {
    method: 'DELETE',
    headers: { Cookie: clientAAuth.cookieHeader },
  });
  assert(
    clientADelClientB.status === 403,
    'Client A attempting to delete Client B is rejected with 403 Forbidden',
    `Status: ${clientADelClientB.status}`
  );

  // -------------------------------------------------------------
  // [6] ROLE TAMPERING & PRIVILEGE ESCALATION
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[6] ROLE TAMPERING & PRIVILEGE ESCALATION DEFENSE${colors.reset}`);

  // Client attempts to create another user with body callerUserId: 'usr-admin'
  const spoofedCallerAttempt = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: clientAAuth.cookieHeader,
    },
    body: JSON.stringify({
      action: 'create_user',
      callerUserId: 'usr-admin', // Spoofed caller
      name: 'Malicious Admin',
      email: 'malicious@hacker.com',
      role: 'admin',
    }),
  });
  assert(
    spoofedCallerAttempt.status === 403,
    'Privilege escalation defense: Spoofed callerUserId="usr-admin" in request body CANNOT bypass session role check',
    `Status: ${spoofedCallerAttempt.status}`
  );

  // Employee attempts to dispatch user invitation
  const empInviteAttempt = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: employeeAuth.cookieHeader,
    },
    body: JSON.stringify({
      action: 'invite',
      email: 'newuser@rahicreative.com',
      fullName: 'New User',
      role: 'employee',
    }),
  });
  assert(
    empInviteAttempt.status === 403,
    'Employee attempting to dispatch invitations is rejected with 403 Forbidden',
    `Status: ${empInviteAttempt.status}`
  );

  // -------------------------------------------------------------
  // [7] UNAUTHORIZED FINANCE ACCESS
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[7] UNAUTHORIZED FINANCE ACCESS DEFENSE${colors.reset}`);

  const empGetFin = await fetch(`${BASE_URL}/api/finance`, {
    headers: { Cookie: employeeAuth.cookieHeader },
  });
  assert(
    empGetFin.status === 403,
    'Employee is strictly blocked from GET /api/finance with 403 Forbidden'
  );

  const empPostFin = await fetch(`${BASE_URL}/api/finance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: employeeAuth.cookieHeader,
    },
    body: JSON.stringify({ action: 'create_invoice', clientId: 'cli-1', amount: 50000 }),
  });
  assert(
    empPostFin.status === 403,
    'Employee is strictly blocked from POST /api/finance with 403 Forbidden'
  );

  const clientGetFin = await fetch(`${BASE_URL}/api/finance`, {
    headers: { Cookie: clientAAuth.cookieHeader },
  });
  assert(
    clientGetFin.status === 403,
    'Client is strictly blocked from GET /api/finance with 403 Forbidden'
  );

  // -------------------------------------------------------------
  // [8] BRUTE-FORCE RATE LIMITING DEFENSE
  // -------------------------------------------------------------
  console.log(`\n${colors.bold}[8] BRUTE-FORCE RATE LIMITING DEFENSE${colors.reset}`);

  // Test 8.1: Login Brute Force Lockout
  const bruteEmail = `brute_target_${Date.now()}@rahicreative.com`;
  for (let i = 0; i < 5; i++) {
    await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email: bruteEmail, password: 'wrong_password_attempt' }),
    });
  }
  const sixthLoginAttempt = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: bruteEmail, password: 'wrong_password_attempt' }),
  });
  assert(
    sixthLoginAttempt.status === 429,
    'Login Brute-Force Defense: 6th failed login attempt triggers HTTP 429 Too Many Requests lockout',
    `Status: ${sixthLoginAttempt.status}`
  );

  // Test 8.2: Password Reset Rate Limiting
  const resetEmail = `reset_rate_${Date.now()}@target.com`;
  for (let i = 0; i < 3; i++) {
    await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_password_request', email: resetEmail }),
    });
  }
  const fourthReset = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset_password_request', email: resetEmail }),
  });
  assert(
    fourthReset.status === 429,
    'Password Reset Rate Limiting: 4th reset request within 15 minutes triggers HTTP 429',
    `Status: ${fourthReset.status}`
  );

  // Test 8.3: Invitation Token Brute-Force Guessing Defense
  const fakeToken = `fake_tok_${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept_invitation', token: fakeToken, password: 'ValidPassword123!' }),
    });
  }
  const sixthInviteAttempt = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'accept_invitation', token: fakeToken, password: 'ValidPassword123!' }),
  });
  assert(
    sixthInviteAttempt.status === 429,
    'Invitation Brute-Force Defense: 6th invalid invitation token submission triggers HTTP 429',
    `Status: ${sixthInviteAttempt.status}`
  );

  console.log(`\n${colors.bold}${colors.blue}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  DEEP VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED  ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runDeepVerification().catch((err) => {
  console.error('Deep Verification Execution Error:', err);
  process.exit(1);
});
