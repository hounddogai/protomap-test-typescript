import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedStepProposalEngine } from "./batched-step-proposal-engine.js";
import { newBatchedStepProposal } from "./batched-step-proposal.js";

test("BatchedStepProposalEngine keeps results within bounds", () => {
  const engine = defaultBatchedStepProposalEngine(flags.newRegistry());
  const item = newBatchedStepProposal("code-237", "name-973");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
