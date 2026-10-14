import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveComplaintProposalEngine } from "./adaptive-complaint-proposal-engine.js";
import { newAdaptiveComplaintProposal } from "./adaptive-complaint-proposal.js";

test("AdaptiveComplaintProposalEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveComplaintProposalEngine(flags.newRegistry());
  const item = newAdaptiveComplaintProposal("code-413", "label-355");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
