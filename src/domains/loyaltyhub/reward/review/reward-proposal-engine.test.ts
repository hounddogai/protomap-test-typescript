import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardProposalEngine } from "./reward-proposal-engine.js";
import { newRewardProposal } from "./reward-proposal.js";

test("RewardProposalEngine keeps results within bounds", () => {
  const engine = defaultRewardProposalEngine();
  const item = newRewardProposal("code-19", "name-809");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
