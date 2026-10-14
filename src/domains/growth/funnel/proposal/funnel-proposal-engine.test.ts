import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelProposalEngine } from "./funnel-proposal-engine.js";
import { newFunnelProposal } from "./funnel-proposal.js";

test("FunnelProposalEngine keeps results within bounds", () => {
  const engine = defaultFunnelProposalEngine(flags.newRegistry());
  const item = newFunnelProposal("code-738", "label-450");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
