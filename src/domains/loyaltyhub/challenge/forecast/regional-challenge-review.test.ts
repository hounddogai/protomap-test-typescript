import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalChallengeReview } from "./regional-challenge-review.js";

test("RegionalChallengeReview starts in draft", () => {
  const item = newRegionalChallengeReview("code-37", "title-88");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalChallengeReview moves to pending", () => {
  const item = newRegionalChallengeReview("code-37", "title-88");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RegionalChallengeReview rejects moves from closed", () => {
  const item = newRegionalChallengeReview("code-37", "title-88");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
