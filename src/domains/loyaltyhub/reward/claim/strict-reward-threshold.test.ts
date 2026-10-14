import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRewardThreshold } from "./strict-reward-threshold.js";

test("StrictRewardThreshold starts in idle", () => {
  const item = newStrictRewardThreshold("code-574", "label-71");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRewardThreshold moves to draining", () => {
  const item = newStrictRewardThreshold("code-574", "label-71");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("StrictRewardThreshold rejects moves from stopped", () => {
  const item = newStrictRewardThreshold("code-574", "label-71");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
