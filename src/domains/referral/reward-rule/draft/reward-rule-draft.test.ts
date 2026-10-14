import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleDraft } from "./reward-rule-draft.js";

test("RewardRuleDraft starts in proposed", () => {
  const item = newRewardRuleDraft("code-321", "name-539");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleDraft moves to rejected", () => {
  const item = newRewardRuleDraft("code-321", "name-539");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardRuleDraft rejects moves from withdrawn", () => {
  const item = newRewardRuleDraft("code-321", "name-539");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
