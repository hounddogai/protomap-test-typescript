import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationPlan } from "./escalation-plan.js";

test("EscalationPlan starts in idle", () => {
  const item = newEscalationPlan("code-865", "label-926");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationPlan moves to ready", () => {
  const item = newEscalationPlan("code-865", "label-926");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("EscalationPlan rejects moves from stopped", () => {
  const item = newEscalationPlan("code-865", "label-926");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
