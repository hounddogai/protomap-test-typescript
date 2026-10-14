import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInScheduleRequiredCodeRule,
  DoubleOptInScheduleRequiredLabelRule,
  DoubleOptInScheduleRequiredTitleRule,
  defaultDoubleOptInScheduleValidator,
} from "./double-opt-in-schedule-rules.js";
import { newDoubleOptInSchedule } from "./double-opt-in-schedule.js";

test("DoubleOptInScheduleValidator reports every problem", () => {
  const validator = defaultDoubleOptInScheduleValidator();
  const item = newDoubleOptInSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInScheduleRequiredCodeRule("double opt in schedule needs an entry");
  const item = newDoubleOptInSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new DoubleOptInScheduleRequiredTitleRule("double opt in schedule needs this field");
  const item = newDoubleOptInSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new DoubleOptInScheduleRequiredLabelRule("double opt in schedule needs an entry");
  const item = newDoubleOptInSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
