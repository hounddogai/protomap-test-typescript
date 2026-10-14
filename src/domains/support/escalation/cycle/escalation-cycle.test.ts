import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationCycle } from "./escalation-cycle.js";

test("EscalationCycle starts in new", () => {
  const item = newEscalationCycle("code-522", "label-472");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationCycle moves to running", () => {
  const item = newEscalationCycle("code-522", "label-472");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("EscalationCycle rejects moves from failed", () => {
  const item = newEscalationCycle("code-522", "label-472");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
