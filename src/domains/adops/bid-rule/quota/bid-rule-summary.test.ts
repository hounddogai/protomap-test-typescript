import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleSummary } from "./bid-rule-summary.js";

test("BidRuleSummary starts in new", () => {
  const item = newBidRuleSummary("code-867", "name-2");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleSummary moves to running", () => {
  const item = newBidRuleSummary("code-867", "name-2");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BidRuleSummary rejects moves from failed", () => {
  const item = newBidRuleSummary("code-867", "name-2");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
