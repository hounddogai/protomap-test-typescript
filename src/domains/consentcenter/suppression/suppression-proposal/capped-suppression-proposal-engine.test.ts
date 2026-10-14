import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedSuppressionProposalEngine } from "./capped-suppression-proposal-engine.js";
import { newCappedSuppressionProposal } from "./capped-suppression-proposal.js";

test("CappedSuppressionProposalEngine keeps results within bounds", () => {
  const engine = defaultCappedSuppressionProposalEngine(flags.newRegistry());
  const item = newCappedSuppressionProposal("code-977", "label-938");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
