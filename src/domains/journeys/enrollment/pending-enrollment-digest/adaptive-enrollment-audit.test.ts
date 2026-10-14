import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveEnrollmentAudit } from "./adaptive-enrollment-audit.js";

test("AdaptiveEnrollmentAudit starts in requested", () => {
  const item = newAdaptiveEnrollmentAudit("code-764", "name-451");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveEnrollmentAudit moves to revoked", () => {
  const item = newAdaptiveEnrollmentAudit("code-764", "name-451");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("AdaptiveEnrollmentAudit rejects moves from expired", () => {
  const item = newAdaptiveEnrollmentAudit("code-764", "name-451");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
