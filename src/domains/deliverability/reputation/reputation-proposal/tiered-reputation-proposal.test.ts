import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredReputationProposal } from "./tiered-reputation-proposal.js";

test("TieredReputationProposal starts in new", () => {
  const item = newTieredReputationProposal("code-816", "name-41");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredReputationProposal moves to failed", () => {
  const item = newTieredReputationProposal("code-816", "name-41");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("TieredReputationProposal rejects moves from failed", () => {
  const item = newTieredReputationProposal("code-816", "name-41");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
