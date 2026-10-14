import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRedemptionProposal } from "./regional-redemption-proposal.js";

test("RegionalRedemptionProposal starts in draft", () => {
  const item = newRegionalRedemptionProposal("code-762", "title-493");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRedemptionProposal moves to suspended", () => {
  const item = newRegionalRedemptionProposal("code-762", "title-493");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RegionalRedemptionProposal rejects moves from closed", () => {
  const item = newRegionalRedemptionProposal("code-762", "title-493");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
