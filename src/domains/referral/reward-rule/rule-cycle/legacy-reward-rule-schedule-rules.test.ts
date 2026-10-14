import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyRewardRuleScheduleCapacityRangeRule,
  LegacyRewardRuleScheduleCodeLengthRule,
  LegacyRewardRuleScheduleRequiredCodeRule,
  defaultLegacyRewardRuleScheduleValidator,
} from "./legacy-reward-rule-schedule-rules.js";
import { newLegacyRewardRuleSchedule } from "./legacy-reward-rule-schedule.js";

test("LegacyRewardRuleScheduleValidator reports every problem", () => {
  const validator = defaultLegacyRewardRuleScheduleValidator();
  const item = newLegacyRewardRuleSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyRewardRuleScheduleCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacyRewardRuleScheduleCapacityRangeRule(255, 1000);
  const item = newLegacyRewardRuleSchedule("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyRewardRuleScheduleCodeLengthRule flags a long code", () => {
  const rule = new LegacyRewardRuleScheduleCodeLengthRule(120);
  const item = newLegacyRewardRuleSchedule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyRewardRuleScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyRewardRuleScheduleRequiredCodeRule("legacy reward rule schedule needs a value");
  const item = newLegacyRewardRuleSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
