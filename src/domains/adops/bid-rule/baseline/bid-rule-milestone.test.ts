import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleMilestone } from "./bid-rule-milestone.js";

test("BidRuleMilestone starts in open", () => {
  const item = newBidRuleMilestone("code-921", "label-863");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleMilestone moves to reopened", () => {
  const item = newBidRuleMilestone("code-921", "label-863");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BidRuleMilestone rejects moves from archived", () => {
  const item = newBidRuleMilestone("code-921", "label-863");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
