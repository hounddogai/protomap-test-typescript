import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceProposalEngine } from "./preference-proposal-engine.js";
import { newPreferenceProposal } from "./preference-proposal.js";

test("PreferenceProposalEngine keeps results within bounds", () => {
  const engine = defaultPreferenceProposalEngine(flags.newRegistry());
  const item = newPreferenceProposal("code-909", "name-994");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
