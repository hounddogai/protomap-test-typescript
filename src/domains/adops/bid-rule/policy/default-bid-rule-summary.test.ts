import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultBidRuleSummary } from "./default-bid-rule-summary.js";

test("DefaultBidRuleSummary starts in planned", () => {
  const item = newDefaultBidRuleSummary("code-244", "label-869");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultBidRuleSummary moves to scheduled", () => {
  const item = newDefaultBidRuleSummary("code-244", "label-869");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultBidRuleSummary rejects moves from cancelled", () => {
  const item = newDefaultBidRuleSummary("code-244", "label-869");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
