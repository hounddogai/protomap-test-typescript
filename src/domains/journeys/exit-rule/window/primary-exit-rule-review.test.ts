import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryExitRuleReview } from "./primary-exit-rule-review.js";

test("PrimaryExitRuleReview starts in draft", () => {
  const item = newPrimaryExitRuleReview("code-813", "name-736");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryExitRuleReview moves to pending", () => {
  const item = newPrimaryExitRuleReview("code-813", "name-736");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryExitRuleReview rejects moves from closed", () => {
  const item = newPrimaryExitRuleReview("code-813", "name-736");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
