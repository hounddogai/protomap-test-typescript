import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintProposalEngine } from "./complaint-proposal-engine.js";
import { newComplaintProposal } from "./complaint-proposal.js";

test("ComplaintProposalEngine keeps results within bounds", () => {
  const engine = defaultComplaintProposalEngine(flags.newRegistry());
  const item = newComplaintProposal("code-146", "name-102");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
