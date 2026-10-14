import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeProposalEngine } from "./challenge-proposal-engine.js";
import { newChallengeProposal } from "./challenge-proposal.js";

test("ChallengeProposalEngine keeps results within bounds", () => {
  const engine = defaultChallengeProposalEngine();
  const item = newChallengeProposal("code-246", "label-258");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
