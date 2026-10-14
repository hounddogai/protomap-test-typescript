import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPreferenceProposalEngine } from "./fallback-preference-proposal-engine.js";
import { newFallbackPreferenceProposal } from "./fallback-preference-proposal.js";

test("FallbackPreferenceProposalEngine keeps results within bounds", () => {
  const engine = defaultFallbackPreferenceProposalEngine(flags.newRegistry());
  const item = newFallbackPreferenceProposal("code-749", "title-702");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
