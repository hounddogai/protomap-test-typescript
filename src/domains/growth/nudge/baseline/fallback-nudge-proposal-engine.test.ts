import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackNudgeProposalEngine } from "./fallback-nudge-proposal-engine.js";
import { newFallbackNudgeProposal } from "./fallback-nudge-proposal.js";

test("FallbackNudgeProposalEngine keeps results within bounds", () => {
  const engine = defaultFallbackNudgeProposalEngine(flags.newRegistry());
  const item = newFallbackNudgeProposal("code-494", "label-888");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
