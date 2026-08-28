import assert from "node:assert";

async function runTests() {
  const baseUrl = "http://localhost:3000";
  console.log(`Starting security integration tests against ${baseUrl}...\n`);

  let passed = 0;
  let failed = 0;

  async function testEndpoint(name, url, method, body, expectedStatuses) {
    try {
      const res = await fetch(`${baseUrl}${url}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });

      if (expectedStatuses.includes(res.status)) {
        console.log(`✅ [PASS] ${name} returned ${res.status} (Expected)`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${name} returned ${res.status} (Expected one of ${expectedStatuses.join(", ")})`);
        failed++;
      }
    } catch (e) {
      console.error(`❌ [FAIL] ${name} threw an error: ${e.message}`);
      failed++;
    }
  }

  // Test 1: Unauthenticated user trying to invite a member
  await testEndpoint(
    "Unauthenticated Admin Invite",
    "/api/admin/invite",
    "POST",
    { email: "hacker@example.com", role: "admin", duration: 7 },
    [401, 403]
  );

  // Test 2: Unauthenticated user trying to register an account
  await testEndpoint(
    "Unauthenticated Account Registration",
    "/api/auth/register",
    "POST",
    { email: "hacker@example.com", password: "password123!", role: "admin" },
    [401, 403]
  );

  // Test 3: Unauthenticated user trying to update a member profile
  await testEndpoint(
    "Unauthenticated Profile Update (IDOR attempt)",
    "/api/membre/profile",
    "PUT",
    { first_name: "Hacker", last_name: "Man", phone: "12345678", classe: "3AGI", statut_membre: "actif" },
    [401, 403]
  );

  // Test 4: Unauthenticated user trying to grant points
  await testEndpoint(
    "Unauthenticated Points Grant",
    "/api/admin/points",
    "POST",
    { user_id: "00000000-0000-0000-0000-000000000000", amount: 1000, reason: "Hacked" },
    [401, 403]
  );

  // Test 5: Unauthenticated user trying to create a calendar event
  await testEndpoint(
    "Unauthenticated Calendar Event Creation",
    "/api/calendar",
    "POST",
    { title: "Hacked Event", type: "event", date_start: new Date().toISOString() },
    [401, 403]
  );

  // Test 6: Unauthenticated user trying to delete a calendar event
  await testEndpoint(
    "Unauthenticated Calendar Event Deletion",
    "/api/calendar?id=00000000-0000-0000-0000-000000000000",
    "DELETE",
    null,
    [401, 403]
  );

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
