import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeProposal } from "./challenge-proposal.js";

test("ChallengeProposal starts in created", () => {
  const item = newChallengeProposal("code-246", "label-258");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeProposal moves to published", () => {
  const item = newChallengeProposal("code-246", "label-258");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ChallengeProposal rejects moves from retired", () => {
  const item = newChallengeProposal("code-246", "label-258");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
