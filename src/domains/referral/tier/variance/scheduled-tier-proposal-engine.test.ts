import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledTierProposalEngine } from "./scheduled-tier-proposal-engine.js";
import { newScheduledTierProposal } from "./scheduled-tier-proposal.js";

test("ScheduledTierProposalEngine keeps results within bounds", () => {
  const engine = defaultScheduledTierProposalEngine(flags.newRegistry());
  const item = newScheduledTierProposal("code-10", "label-15");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
