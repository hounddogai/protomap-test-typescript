import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionProposalEngine } from "./redemption-proposal-engine.js";
import { newRedemptionProposal } from "./redemption-proposal.js";

test("RedemptionProposalEngine keeps results within bounds", () => {
  const engine = defaultRedemptionProposalEngine(flags.newRegistry());
  const item = newRedemptionProposal("code-209", "label-653");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
