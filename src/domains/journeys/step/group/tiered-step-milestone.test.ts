import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredStepMilestone } from "./tiered-step-milestone.js";

test("TieredStepMilestone starts in idle", () => {
  const item = newTieredStepMilestone("code-44", "title-752");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredStepMilestone moves to ready", () => {
  const item = newTieredStepMilestone("code-44", "title-752");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredStepMilestone rejects moves from stopped", () => {
  const item = newTieredStepMilestone("code-44", "title-752");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
