import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardProposal } from "./pending-reward-proposal.js";

test("PendingRewardProposal starts in created", () => {
  const item = newPendingRewardProposal("code-589", "name-568");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardProposal moves to validated", () => {
  const item = newPendingRewardProposal("code-589", "name-568");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingRewardProposal rejects moves from retired", () => {
  const item = newPendingRewardProposal("code-589", "name-568");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
