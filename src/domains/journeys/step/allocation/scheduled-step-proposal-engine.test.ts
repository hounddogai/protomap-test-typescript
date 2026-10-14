import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledStepProposalEngine } from "./scheduled-step-proposal-engine.js";
import { newScheduledStepProposal } from "./scheduled-step-proposal.js";

test("ScheduledStepProposalEngine keeps results within bounds", () => {
  const engine = defaultScheduledStepProposalEngine(flags.newRegistry());
  const item = newScheduledStepProposal("code-753", "title-787");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
