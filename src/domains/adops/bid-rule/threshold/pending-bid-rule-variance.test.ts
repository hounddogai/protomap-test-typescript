import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBidRuleVariance } from "./pending-bid-rule-variance.js";

test("PendingBidRuleVariance starts in created", () => {
  const item = newPendingBidRuleVariance("code-121", "title-871");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBidRuleVariance moves to retired", () => {
  const item = newPendingBidRuleVariance("code-121", "title-871");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PendingBidRuleVariance rejects moves from retired", () => {
  const item = newPendingBidRuleVariance("code-121", "title-871");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
