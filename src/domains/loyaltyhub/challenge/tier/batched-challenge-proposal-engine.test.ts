import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedChallengeProposalEngine } from "./batched-challenge-proposal-engine.js";
import { newBatchedChallengeProposal } from "./batched-challenge-proposal.js";

test("BatchedChallengeProposalEngine keeps results within bounds", () => {
  const engine = defaultBatchedChallengeProposalEngine();
  const item = newBatchedChallengeProposal("code-574", "label-868");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
