import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardProposal } from "./reward-proposal.js";

test("RewardProposal starts in proposed", () => {
  const item = newRewardProposal("code-19", "name-809");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardProposal moves to rejected", () => {
  const item = newRewardProposal("code-19", "name-809");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardProposal rejects moves from withdrawn", () => {
  const item = newRewardProposal("code-19", "name-809");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
