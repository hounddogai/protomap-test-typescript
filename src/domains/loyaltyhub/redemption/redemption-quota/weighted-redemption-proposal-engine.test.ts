import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedRedemptionProposalEngine } from "./weighted-redemption-proposal-engine.js";
import { newWeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

test("WeightedRedemptionProposalEngine keeps results within bounds", () => {
  const engine = defaultWeightedRedemptionProposalEngine(flags.newRegistry());
  const item = newWeightedRedemptionProposal("code-231", "label-787");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
