import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedPacingProposalEngine } from "./batched-pacing-proposal-engine.js";
import { newBatchedPacingProposal } from "./batched-pacing-proposal.js";

test("BatchedPacingProposalEngine keeps results within bounds", () => {
  const engine = defaultBatchedPacingProposalEngine();
  const item = newBatchedPacingProposal("code-282", "title-57");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
