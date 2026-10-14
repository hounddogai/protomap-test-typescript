import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRewardReview } from "./fallback-reward-review.js";

test("FallbackRewardReview starts in new", () => {
  const item = newFallbackRewardReview("code-296", "name-142");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRewardReview moves to queued", () => {
  const item = newFallbackRewardReview("code-296", "name-142");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackRewardReview rejects moves from failed", () => {
  const item = newFallbackRewardReview("code-296", "name-142");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
