import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledEnrollmentQuota } from "./scheduled-enrollment-quota.js";

test("ScheduledEnrollmentQuota starts in requested", () => {
  const item = newScheduledEnrollmentQuota("code-79", "title-794");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledEnrollmentQuota moves to revoked", () => {
  const item = newScheduledEnrollmentQuota("code-79", "title-794");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ScheduledEnrollmentQuota rejects moves from expired", () => {
  const item = newScheduledEnrollmentQuota("code-79", "title-794");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
