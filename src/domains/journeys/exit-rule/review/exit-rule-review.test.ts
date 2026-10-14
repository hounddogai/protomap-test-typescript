import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleReview } from "./exit-rule-review.js";

test("ExitRuleReview starts in new", () => {
  const item = newExitRuleReview("code-415", "label-714");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleReview moves to queued", () => {
  const item = newExitRuleReview("code-415", "label-714");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ExitRuleReview rejects moves from failed", () => {
  const item = newExitRuleReview("code-415", "label-714");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
