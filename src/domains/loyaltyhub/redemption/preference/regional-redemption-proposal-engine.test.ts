import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalRedemptionProposalEngine } from "./regional-redemption-proposal-engine.js";
import { newRegionalRedemptionProposal } from "./regional-redemption-proposal.js";

test("RegionalRedemptionProposalEngine keeps results within bounds", () => {
  const engine = defaultRegionalRedemptionProposalEngine(flags.newRegistry());
  const item = newRegionalRedemptionProposal("code-762", "title-493");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
