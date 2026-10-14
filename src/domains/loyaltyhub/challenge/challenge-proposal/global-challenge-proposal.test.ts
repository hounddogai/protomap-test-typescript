import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalChallengeProposal } from "./global-challenge-proposal.js";

test("GlobalChallengeProposal starts in open", () => {
  const item = newGlobalChallengeProposal("code-215", "name-711");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalChallengeProposal moves to archived", () => {
  const item = newGlobalChallengeProposal("code-215", "name-711");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("GlobalChallengeProposal rejects moves from archived", () => {
  const item = newGlobalChallengeProposal("code-215", "name-711");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
