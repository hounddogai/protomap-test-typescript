import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedBadgeQuota } from "./weighted-badge-quota.js";

test("WeightedBadgeQuota starts in idle", () => {
  const item = newWeightedBadgeQuota("code-140", "name-684");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedBadgeQuota moves to stopped", () => {
  const item = newWeightedBadgeQuota("code-140", "name-684");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("WeightedBadgeQuota rejects moves from stopped", () => {
  const item = newWeightedBadgeQuota("code-140", "name-684");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
