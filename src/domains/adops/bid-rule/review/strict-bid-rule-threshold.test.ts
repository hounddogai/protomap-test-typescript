import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBidRuleThreshold } from "./strict-bid-rule-threshold.js";

test("StrictBidRuleThreshold starts in new", () => {
  const item = newStrictBidRuleThreshold("code-3", "name-892");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBidRuleThreshold moves to running", () => {
  const item = newStrictBidRuleThreshold("code-3", "name-892");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictBidRuleThreshold rejects moves from failed", () => {
  const item = newStrictBidRuleThreshold("code-3", "name-892");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
