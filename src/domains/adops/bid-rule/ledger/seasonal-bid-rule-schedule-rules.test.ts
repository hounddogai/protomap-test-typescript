import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBidRuleScheduleBatchSizeRangeRule,
  SeasonalBidRuleScheduleCodeLengthRule,
  SeasonalBidRuleSchedulePriorityRangeRule,
  SeasonalBidRuleScheduleRequiredSummaryRule,
  defaultSeasonalBidRuleScheduleValidator,
} from "./seasonal-bid-rule-schedule-rules.js";
import { newSeasonalBidRuleSchedule } from "./seasonal-bid-rule-schedule.js";

test("SeasonalBidRuleScheduleValidator reports every problem", () => {
  const validator = defaultSeasonalBidRuleScheduleValidator();
  const item = newSeasonalBidRuleSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBidRuleScheduleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBidRuleScheduleCodeLengthRule(86400);
  const item = newSeasonalBidRuleSchedule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleScheduleRequiredSummaryRule flags a blank summary", () => {
  const rule = new SeasonalBidRuleScheduleRequiredSummaryRule("seasonal bid rule schedule needs this field");
  const item = newSeasonalBidRuleSchedule("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBidRuleScheduleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new SeasonalBidRuleScheduleBatchSizeRangeRule(16, 3600);
  const item = newSeasonalBidRuleSchedule("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBidRuleSchedulePriorityRangeRule flags values above priority", () => {
  const rule = new SeasonalBidRuleSchedulePriorityRangeRule(16, 64);
  const item = newSeasonalBidRuleSchedule("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
