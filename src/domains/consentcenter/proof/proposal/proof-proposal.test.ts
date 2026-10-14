import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofProposal } from "./proof-proposal.js";

test("ProofProposal starts in planned", () => {
  const item = newProofProposal("code-310", "title-791");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofProposal moves to scheduled", () => {
  const item = newProofProposal("code-310", "title-791");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ProofProposal rejects moves from cancelled", () => {
  const item = newProofProposal("code-310", "title-791");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
