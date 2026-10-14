import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardRuleEstimate } from "./pending-reward-rule-estimate.js";

test("PendingRewardRuleEstimate starts in proposed", () => {
  const item = newPendingRewardRuleEstimate("code-853", "name-620");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardRuleEstimate moves to withdrawn", () => {
  const item = newPendingRewardRuleEstimate("code-853", "name-620");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PendingRewardRuleEstimate rejects moves from withdrawn", () => {
  const item = newPendingRewardRuleEstimate("code-853", "name-620");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
