import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRewardRuleAdjustment } from "./manual-reward-rule-adjustment.js";

test("ManualRewardRuleAdjustment starts in open", () => {
  const item = newManualRewardRuleAdjustment("code-41", "name-793");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRewardRuleAdjustment moves to resolved", () => {
  const item = newManualRewardRuleAdjustment("code-41", "name-793");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualRewardRuleAdjustment rejects moves from archived", () => {
  const item = newManualRewardRuleAdjustment("code-41", "name-793");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
