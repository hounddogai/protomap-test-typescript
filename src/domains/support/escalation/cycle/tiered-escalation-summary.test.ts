import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredEscalationSummary } from "./tiered-escalation-summary.js";

test("TieredEscalationSummary starts in new", () => {
  const item = newTieredEscalationSummary("code-990", "label-221");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredEscalationSummary moves to running", () => {
  const item = newTieredEscalationSummary("code-990", "label-221");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TieredEscalationSummary rejects moves from failed", () => {
  const item = newTieredEscalationSummary("code-990", "label-221");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
