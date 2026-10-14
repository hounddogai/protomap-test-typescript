import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementProposalEngine } from "./placement-proposal-engine.js";
import { newPlacementProposal } from "./placement-proposal.js";

test("PlacementProposalEngine keeps results within bounds", () => {
  const engine = defaultPlacementProposalEngine();
  const item = newPlacementProposal("code-956", "title-708");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
