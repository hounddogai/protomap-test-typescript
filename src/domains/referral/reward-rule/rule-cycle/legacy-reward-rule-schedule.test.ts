import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRewardRuleSchedule } from "./legacy-reward-rule-schedule.js";

test("LegacyRewardRuleSchedule starts in open", () => {
  const item = newLegacyRewardRuleSchedule("code-234", "title-819");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRewardRuleSchedule moves to archived", () => {
  const item = newLegacyRewardRuleSchedule("code-234", "title-819");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("LegacyRewardRuleSchedule rejects moves from archived", () => {
  const item = newLegacyRewardRuleSchedule("code-234", "title-819");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
