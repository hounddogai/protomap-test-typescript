import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentMilestone } from "./enrollment-milestone.js";

test("EnrollmentMilestone starts in requested", () => {
  const item = newEnrollmentMilestone("code-197", "label-542");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentMilestone moves to granted", () => {
  const item = newEnrollmentMilestone("code-197", "label-542");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("EnrollmentMilestone rejects moves from expired", () => {
  const item = newEnrollmentMilestone("code-197", "label-542");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
