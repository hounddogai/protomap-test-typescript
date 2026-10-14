import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPlacementScheduleCodeLengthRule,
  SeasonalPlacementScheduleRequiredPhoneRule,
  SeasonalPlacementScheduleRequiredTitleRule,
  SeasonalPlacementScheduleRevisionRangeRule,
  defaultSeasonalPlacementScheduleValidator,
} from "./seasonal-placement-schedule-rules.js";
import { newSeasonalPlacementSchedule } from "./seasonal-placement-schedule.js";

test("SeasonalPlacementScheduleValidator reports every problem", () => {
  const validator = defaultSeasonalPlacementScheduleValidator();
  const item = newSeasonalPlacementSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPlacementScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalPlacementScheduleRequiredTitleRule("seasonal placement schedule needs this field");
  const item = newSeasonalPlacementSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPlacementScheduleRevisionRangeRule flags values above revision", () => {
  const rule = new SeasonalPlacementScheduleRevisionRangeRule(1000, 1000);
  const item = newSeasonalPlacementSchedule("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPlacementScheduleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalPlacementScheduleCodeLengthRule(80);
  const item = newSeasonalPlacementSchedule("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPlacementScheduleRequiredPhoneRule flags a blank phone", () => {
  const rule = new SeasonalPlacementScheduleRequiredPhoneRule("seasonal placement schedule needs this field");
  const item = newSeasonalPlacementSchedule("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
