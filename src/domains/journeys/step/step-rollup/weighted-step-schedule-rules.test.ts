import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedStepScheduleCeilingRangeRule,
  WeightedStepScheduleRequiredSourceRule,
  WeightedStepScheduleRequiredTitleRule,
  WeightedStepScheduleRevisionRangeRule,
  defaultWeightedStepScheduleValidator,
} from "./weighted-step-schedule-rules.js";
import { newWeightedStepSchedule } from "./weighted-step-schedule.js";

test("WeightedStepScheduleValidator reports every problem", () => {
  const validator = defaultWeightedStepScheduleValidator();
  const item = newWeightedStepSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedStepScheduleRevisionRangeRule flags values above revision", () => {
  const rule = new WeightedStepScheduleRevisionRangeRule(64, 255);
  const item = newWeightedStepSchedule("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedStepScheduleCeilingRangeRule flags values above ceiling", () => {
  const rule = new WeightedStepScheduleCeilingRangeRule(1.6, 4944.9);
  const item = newWeightedStepSchedule("x", "y");
  item.ceiling = 4946.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedStepScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedStepScheduleRequiredTitleRule("weighted step schedule needs this field");
  const item = newWeightedStepSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedStepScheduleRequiredSourceRule flags a blank source", () => {
  const rule = new WeightedStepScheduleRequiredSourceRule("weighted step schedule needs an entry");
  const item = newWeightedStepSchedule("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
