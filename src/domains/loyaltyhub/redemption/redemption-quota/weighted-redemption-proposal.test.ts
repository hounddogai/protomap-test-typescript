import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

test("WeightedRedemptionProposal starts in open", () => {
  const item = newWeightedRedemptionProposal("code-231", "label-787");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRedemptionProposal moves to in review", () => {
  const item = newWeightedRedemptionProposal("code-231", "label-787");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedRedemptionProposal rejects moves from archived", () => {
  const item = newWeightedRedemptionProposal("code-231", "label-787");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
