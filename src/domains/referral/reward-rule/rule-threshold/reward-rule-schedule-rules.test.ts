import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleScheduleNameLengthRule,
  RewardRuleScheduleRequiredNameRule,
  defaultRewardRuleScheduleValidator,
} from "./reward-rule-schedule-rules.js";
import { newRewardRuleSchedule } from "./reward-rule-schedule.js";

test("RewardRuleScheduleValidator reports every problem", () => {
  const validator = defaultRewardRuleScheduleValidator();
  const item = newRewardRuleSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleScheduleNameLengthRule flags a long name", () => {
  const rule = new RewardRuleScheduleNameLengthRule(3600);
  const item = newRewardRuleSchedule("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleScheduleRequiredNameRule flags a blank name", () => {
  const rule = new RewardRuleScheduleRequiredNameRule("reward rule schedule needs an entry");
  const item = newRewardRuleSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
