import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStreakReview } from "./capped-streak-review.js";

test("CappedStreakReview starts in idle", () => {
  const item = newCappedStreakReview("code-174", "label-568");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStreakReview moves to draining", () => {
  const item = newCappedStreakReview("code-174", "label-568");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("CappedStreakReview rejects moves from stopped", () => {
  const item = newCappedStreakReview("code-174", "label-568");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
