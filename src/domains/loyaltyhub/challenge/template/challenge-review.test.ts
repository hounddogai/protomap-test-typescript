import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeReview } from "./challenge-review.js";

test("ChallengeReview starts in created", () => {
  const item = newChallengeReview("code-86", "name-909");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeReview moves to validated", () => {
  const item = newChallengeReview("code-86", "name-909");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ChallengeReview rejects moves from retired", () => {
  const item = newChallengeReview("code-86", "name-909");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
