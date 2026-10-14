import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBidRuleBundle } from "./manual-bid-rule-bundle.js";

test("ManualBidRuleBundle starts in new", () => {
  const item = newManualBidRuleBundle("code-799", "title-199");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBidRuleBundle moves to running", () => {
  const item = newManualBidRuleBundle("code-799", "title-199");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ManualBidRuleBundle rejects moves from failed", () => {
  const item = newManualBidRuleBundle("code-799", "title-199");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
