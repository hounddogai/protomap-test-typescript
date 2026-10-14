import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedEscalationProposalEngine } from "./weighted-escalation-proposal-engine.js";
import { newWeightedEscalationProposal } from "./weighted-escalation-proposal.js";

test("WeightedEscalationProposalEngine keeps results within bounds", () => {
  const engine = defaultWeightedEscalationProposalEngine();
  const item = newWeightedEscalationProposal("code-961", "title-780");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
