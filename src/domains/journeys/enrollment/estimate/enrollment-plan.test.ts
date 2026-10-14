import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentPlan } from "./enrollment-plan.js";

test("EnrollmentPlan starts in idle", () => {
  const item = newEnrollmentPlan("code-604", "title-243");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentPlan moves to ready", () => {
  const item = newEnrollmentPlan("code-604", "title-243");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("EnrollmentPlan rejects moves from stopped", () => {
  const item = newEnrollmentPlan("code-604", "title-243");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
