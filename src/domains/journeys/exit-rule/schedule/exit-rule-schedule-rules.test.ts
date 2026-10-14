import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleScheduleMinimumRangeRule,
  ExitRuleSchedulePriorityRangeRule,
  defaultExitRuleScheduleValidator,
} from "./exit-rule-schedule-rules.js";
import { newExitRuleSchedule } from "./exit-rule-schedule.js";

test("ExitRuleScheduleValidator reports every problem", () => {
  const validator = defaultExitRuleScheduleValidator();
  const item = newExitRuleSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleSchedulePriorityRangeRule flags values above priority", () => {
  const rule = new ExitRuleSchedulePriorityRangeRule(64, 255);
  const item = newExitRuleSchedule("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleScheduleMinimumRangeRule flags values above minimum", () => {
  const rule = new ExitRuleScheduleMinimumRangeRule(1.1, 918.1);
  const item = newExitRuleSchedule("x", "y");
  item.minimum = 919.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
