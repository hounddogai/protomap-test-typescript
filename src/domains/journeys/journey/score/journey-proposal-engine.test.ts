import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyProposalEngine } from "./journey-proposal-engine.js";
import { newJourneyProposal } from "./journey-proposal.js";

test("JourneyProposalEngine keeps results within bounds", () => {
  const engine = defaultJourneyProposalEngine();
  const item = newJourneyProposal("code-629", "label-688");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
