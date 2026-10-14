import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionProposal } from "./subscription-proposal.js";

test("SubscriptionProposal starts in proposed", () => {
  const item = newSubscriptionProposal("code-593", "label-174");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionProposal moves to rejected", () => {
  const item = newSubscriptionProposal("code-593", "label-174");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SubscriptionProposal rejects moves from withdrawn", () => {
  const item = newSubscriptionProposal("code-593", "label-174");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
