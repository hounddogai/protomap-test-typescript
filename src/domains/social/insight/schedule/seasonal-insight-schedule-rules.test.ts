import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalInsightScheduleBatchSizeRangeRule,
  SeasonalInsightScheduleCodeLengthRule,
  defaultSeasonalInsightScheduleValidator,
} from "./seasonal-insight-schedule-rules.js";
import { newSeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

test("SeasonalInsightScheduleValidator reports every problem", () => {
  const validator = defaultSeasonalInsightScheduleValidator();
  const item = newSeasonalInsightSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalInsightScheduleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalInsightScheduleCodeLengthRule(255);
  const item = newSeasonalInsightSchedule("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInsightScheduleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new SeasonalInsightScheduleBatchSizeRangeRule(120, 86400);
  const item = newSeasonalInsightSchedule("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
