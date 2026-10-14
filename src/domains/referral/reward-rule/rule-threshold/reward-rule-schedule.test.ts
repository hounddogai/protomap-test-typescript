import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleSchedule } from "./reward-rule-schedule.js";

test("RewardRuleSchedule starts in idle", () => {
  const item = newRewardRuleSchedule("code-602", "name-349");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleSchedule moves to draining", () => {
  const item = newRewardRuleSchedule("code-602", "name-349");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("RewardRuleSchedule rejects moves from stopped", () => {
  const item = newRewardRuleSchedule("code-602", "name-349");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
