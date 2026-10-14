import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveActivationProposalEngine } from "./adaptive-activation-proposal-engine.js";
import { newAdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

test("AdaptiveActivationProposalEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveActivationProposalEngine();
  const item = newAdaptiveActivationProposal("code-774", "label-979");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
