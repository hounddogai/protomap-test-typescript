import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalPlacementProposalEngine } from "./regional-placement-proposal-engine.js";
import { newRegionalPlacementProposal } from "./regional-placement-proposal.js";

test("RegionalPlacementProposalEngine keeps results within bounds", () => {
  const engine = defaultRegionalPlacementProposalEngine();
  const item = newRegionalPlacementProposal("code-451", "label-688");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
