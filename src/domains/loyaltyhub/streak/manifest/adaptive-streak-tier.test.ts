import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveStreakTier } from "./adaptive-streak-tier.js";

test("AdaptiveStreakTier starts in new", () => {
  const item = newAdaptiveStreakTier("code-561", "label-219");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveStreakTier moves to queued", () => {
  const item = newAdaptiveStreakTier("code-561", "label-219");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveStreakTier rejects moves from failed", () => {
  const item = newAdaptiveStreakTier("code-561", "label-219");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
