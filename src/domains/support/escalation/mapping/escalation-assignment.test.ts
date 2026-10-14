import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationAssignment } from "./escalation-assignment.js";

test("EscalationAssignment starts in idle", () => {
  const item = newEscalationAssignment("code-775", "title-273");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationAssignment moves to stopped", () => {
  const item = newEscalationAssignment("code-775", "title-273");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("EscalationAssignment rejects moves from stopped", () => {
  const item = newEscalationAssignment("code-775", "title-273");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
