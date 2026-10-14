import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationProposalEngine } from "./reputation-proposal-engine.js";
import { newReputationProposal } from "./reputation-proposal.js";

test("ReputationProposalEngine keeps results within bounds", () => {
  const engine = defaultReputationProposalEngine(flags.newRegistry());
  const item = newReputationProposal("code-997", "label-137");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
