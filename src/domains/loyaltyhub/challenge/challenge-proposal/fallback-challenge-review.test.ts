import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackChallengeReview } from "./fallback-challenge-review.js";

test("FallbackChallengeReview starts in draft", () => {
  const item = newFallbackChallengeReview("code-473", "label-379");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackChallengeReview moves to pending", () => {
  const item = newFallbackChallengeReview("code-473", "label-379");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("FallbackChallengeReview rejects moves from closed", () => {
  const item = newFallbackChallengeReview("code-473", "label-379");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
