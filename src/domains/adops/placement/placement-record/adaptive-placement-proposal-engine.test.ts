import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptivePlacementProposalEngine } from "./adaptive-placement-proposal-engine.js";
import { newAdaptivePlacementProposal } from "./adaptive-placement-proposal.js";

test("AdaptivePlacementProposalEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePlacementProposalEngine();
  const item = newAdaptivePlacementProposal("code-768", "label-434");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
