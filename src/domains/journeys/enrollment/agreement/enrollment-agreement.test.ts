import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentAgreement } from "./enrollment-agreement.js";

test("EnrollmentAgreement starts in idle", () => {
  const item = newEnrollmentAgreement("code-307", "name-723");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentAgreement moves to draining", () => {
  const item = newEnrollmentAgreement("code-307", "name-723");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("EnrollmentAgreement rejects moves from stopped", () => {
  const item = newEnrollmentAgreement("code-307", "name-723");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
