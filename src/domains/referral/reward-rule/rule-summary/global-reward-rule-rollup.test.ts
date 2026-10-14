import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalRewardRuleRollup } from "./global-reward-rule-rollup.js";

test("GlobalRewardRuleRollup starts in idle", () => {
  const item = newGlobalRewardRuleRollup("code-806", "title-813");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalRewardRuleRollup moves to warming", () => {
  const item = newGlobalRewardRuleRollup("code-806", "title-813");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalRewardRuleRollup rejects moves from stopped", () => {
  const item = newGlobalRewardRuleRollup("code-806", "title-813");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
