import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardRuleOverride } from "./tiered-reward-rule-override.js";

test("TieredRewardRuleOverride starts in idle", () => {
  const item = newTieredRewardRuleOverride("code-556", "label-922");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardRuleOverride moves to warming", () => {
  const item = newTieredRewardRuleOverride("code-556", "label-922");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TieredRewardRuleOverride rejects moves from stopped", () => {
  const item = newTieredRewardRuleOverride("code-556", "label-922");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
