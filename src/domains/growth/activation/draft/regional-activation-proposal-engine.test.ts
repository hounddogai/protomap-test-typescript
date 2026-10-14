import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalActivationProposalEngine } from "./regional-activation-proposal-engine.js";
import { newRegionalActivationProposal } from "./regional-activation-proposal.js";

test("RegionalActivationProposalEngine keeps results within bounds", () => {
  const engine = defaultRegionalActivationProposalEngine(flags.newRegistry());
  const item = newRegionalActivationProposal("code-430", "label-928");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
