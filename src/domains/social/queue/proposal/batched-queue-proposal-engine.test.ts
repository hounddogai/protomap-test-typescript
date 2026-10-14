import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedQueueProposalEngine } from "./batched-queue-proposal-engine.js";
import { newBatchedQueueProposal } from "./batched-queue-proposal.js";

test("BatchedQueueProposalEngine keeps results within bounds", () => {
  const engine = defaultBatchedQueueProposalEngine();
  const item = newBatchedQueueProposal("code-536", "title-557");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
