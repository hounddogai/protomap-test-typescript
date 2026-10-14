import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleProposalEngine } from "./reward-rule-proposal-engine.js";
import { newRewardRuleProposal } from "./reward-rule-proposal.js";

test("RewardRuleProposalEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleProposalEngine(flags.newRegistry());
  const item = newRewardRuleProposal("code-45", "title-963");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
