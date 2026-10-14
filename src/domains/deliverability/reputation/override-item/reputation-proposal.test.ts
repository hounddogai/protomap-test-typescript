import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationProposal } from "./reputation-proposal.js";

test("ReputationProposal starts in created", () => {
  const item = newReputationProposal("code-997", "label-137");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationProposal moves to retired", () => {
  const item = newReputationProposal("code-997", "label-137");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ReputationProposal rejects moves from retired", () => {
  const item = newReputationProposal("code-997", "label-137");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
