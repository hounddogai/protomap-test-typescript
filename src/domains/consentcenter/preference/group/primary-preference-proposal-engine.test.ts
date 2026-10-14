import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryPreferenceProposalEngine } from "./primary-preference-proposal-engine.js";
import { newPrimaryPreferenceProposal } from "./primary-preference-proposal.js";

test("PrimaryPreferenceProposalEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPreferenceProposalEngine();
  const item = newPrimaryPreferenceProposal("code-777", "name-481");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
