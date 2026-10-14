import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleSnapshot } from "./reward-rule-snapshot.js";

test("RewardRuleSnapshot starts in requested", () => {
  const item = newRewardRuleSnapshot("code-63", "label-291");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleSnapshot moves to granted", () => {
  const item = newRewardRuleSnapshot("code-63", "label-291");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RewardRuleSnapshot rejects moves from expired", () => {
  const item = newRewardRuleSnapshot("code-63", "label-291");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
