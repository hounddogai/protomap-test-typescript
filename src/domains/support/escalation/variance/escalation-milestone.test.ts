import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationMilestone } from "./escalation-milestone.js";

test("EscalationMilestone starts in idle", () => {
  const item = newEscalationMilestone("code-7", "name-286");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationMilestone moves to warming", () => {
  const item = newEscalationMilestone("code-7", "name-286");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("EscalationMilestone rejects moves from stopped", () => {
  const item = newEscalationMilestone("code-7", "name-286");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
