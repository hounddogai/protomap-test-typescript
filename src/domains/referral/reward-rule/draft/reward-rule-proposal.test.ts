import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleProposal } from "./reward-rule-proposal.js";

test("RewardRuleProposal starts in planned", () => {
  const item = newRewardRuleProposal("code-45", "title-963");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleProposal moves to scheduled", () => {
  const item = newRewardRuleProposal("code-45", "title-963");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RewardRuleProposal rejects moves from cancelled", () => {
  const item = newRewardRuleProposal("code-45", "title-963");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
