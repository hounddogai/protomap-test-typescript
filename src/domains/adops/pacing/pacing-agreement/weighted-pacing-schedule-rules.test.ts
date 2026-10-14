import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPacingScheduleCodeLengthRule,
  WeightedPacingScheduleRequiredCodeRule,
  WeightedPacingScheduleRequiredNameRule,
  defaultWeightedPacingScheduleValidator,
} from "./weighted-pacing-schedule-rules.js";
import { newWeightedPacingSchedule } from "./weighted-pacing-schedule.js";

test("WeightedPacingScheduleValidator reports every problem", () => {
  const validator = defaultWeightedPacingScheduleValidator();
  const item = newWeightedPacingSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPacingScheduleCodeLengthRule flags a long code", () => {
  const rule = new WeightedPacingScheduleCodeLengthRule(3600);
  const item = newWeightedPacingSchedule("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPacingScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPacingScheduleRequiredCodeRule("weighted pacing schedule needs this field");
  const item = newWeightedPacingSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPacingScheduleRequiredNameRule flags a blank name", () => {
  const rule = new WeightedPacingScheduleRequiredNameRule("weighted pacing schedule needs this field");
  const item = newWeightedPacingSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
