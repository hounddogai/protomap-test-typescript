import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationPlan } from "./reputation-plan.js";

test("ReputationPlan starts in idle", () => {
  const item = newReputationPlan("code-591", "title-4");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationPlan moves to ready", () => {
  const item = newReputationPlan("code-591", "title-4");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ReputationPlan rejects moves from stopped", () => {
  const item = newReputationPlan("code-591", "title-4");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
