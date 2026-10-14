import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientQueueProposalEngine } from "./lenient-queue-proposal-engine.js";
import { newLenientQueueProposal } from "./lenient-queue-proposal.js";

test("LenientQueueProposalEngine keeps results within bounds", () => {
  const engine = defaultLenientQueueProposalEngine();
  const item = newLenientQueueProposal("code-144", "name-372");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
