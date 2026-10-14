import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationProposalEngine } from "./activation-proposal-engine.js";
import { newActivationProposal } from "./activation-proposal.js";

test("ActivationProposalEngine keeps results within bounds", () => {
  const engine = defaultActivationProposalEngine();
  const item = newActivationProposal("code-696", "label-541");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
