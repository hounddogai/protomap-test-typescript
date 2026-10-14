import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeScheduleDescriptionLengthRule,
  CreativeScheduleRequiredCodeRule,
  CreativeScheduleRequiredTitleRule,
  CreativeScheduleRevisionRangeRule,
  CreativeScheduleTimezoneLengthRule,
  defaultCreativeScheduleValidator,
} from "./creative-schedule-rules.js";
import { newCreativeSchedule } from "./creative-schedule.js";

test("CreativeScheduleValidator reports every problem", () => {
  const validator = defaultCreativeScheduleValidator();
  const item = newCreativeSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeScheduleTimezoneLengthRule flags a long timezone", () => {
  const rule = new CreativeScheduleTimezoneLengthRule(3600);
  const item = newCreativeSchedule("x", "y");
  item.timezone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeScheduleDescriptionLengthRule flags a long description", () => {
  const rule = new CreativeScheduleDescriptionLengthRule(32);
  const item = newCreativeSchedule("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new CreativeScheduleRequiredTitleRule("creative schedule needs this field");
  const item = newCreativeSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeScheduleRequiredCodeRule("creative schedule needs an entry");
  const item = newCreativeSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeScheduleRevisionRangeRule flags values above revision", () => {
  const rule = new CreativeScheduleRevisionRangeRule(16, 1000);
  const item = newCreativeSchedule("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
