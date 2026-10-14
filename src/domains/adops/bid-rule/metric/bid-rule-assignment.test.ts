import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleAssignment } from "./bid-rule-assignment.js";

test("BidRuleAssignment starts in proposed", () => {
  const item = newBidRuleAssignment("code-795", "title-674");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleAssignment moves to rejected", () => {
  const item = newBidRuleAssignment("code-795", "title-674");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BidRuleAssignment rejects moves from withdrawn", () => {
  const item = newBidRuleAssignment("code-795", "title-674");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
