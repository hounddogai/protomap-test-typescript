import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentAudit } from "./enrollment-audit.js";

test("EnrollmentAudit starts in idle", () => {
  const item = newEnrollmentAudit("code-549", "name-56");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentAudit moves to draining", () => {
  const item = newEnrollmentAudit("code-549", "name-56");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("EnrollmentAudit rejects moves from stopped", () => {
  const item = newEnrollmentAudit("code-549", "name-56");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
