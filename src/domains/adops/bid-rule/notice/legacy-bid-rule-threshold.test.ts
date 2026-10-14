import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

test("LegacyBidRuleThreshold starts in new", () => {
  const item = newLegacyBidRuleThreshold("code-233", "label-384");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBidRuleThreshold moves to running", () => {
  const item = newLegacyBidRuleThreshold("code-233", "label-384");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyBidRuleThreshold rejects moves from failed", () => {
  const item = newLegacyBidRuleThreshold("code-233", "label-384");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
