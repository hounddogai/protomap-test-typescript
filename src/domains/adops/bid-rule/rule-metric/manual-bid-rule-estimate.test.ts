import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBidRuleEstimate } from "./manual-bid-rule-estimate.js";

test("ManualBidRuleEstimate starts in new", () => {
  const item = newManualBidRuleEstimate("code-71", "title-111");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBidRuleEstimate moves to done", () => {
  const item = newManualBidRuleEstimate("code-71", "title-111");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ManualBidRuleEstimate rejects moves from failed", () => {
  const item = newManualBidRuleEstimate("code-71", "title-111");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
