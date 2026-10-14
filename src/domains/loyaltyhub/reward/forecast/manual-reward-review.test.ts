import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRewardReview } from "./manual-reward-review.js";

test("ManualRewardReview starts in draft", () => {
  const item = newManualRewardReview("code-526", "name-680");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRewardReview moves to closed", () => {
  const item = newManualRewardReview("code-526", "name-680");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ManualRewardReview rejects moves from closed", () => {
  const item = newManualRewardReview("code-526", "name-680");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
