import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualStreakTier } from "./manual-streak-tier.js";

test("ManualStreakTier starts in new", () => {
  const item = newManualStreakTier("code-263", "name-48");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualStreakTier moves to failed", () => {
  const item = newManualStreakTier("code-263", "name-48");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ManualStreakTier rejects moves from failed", () => {
  const item = newManualStreakTier("code-263", "name-48");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
