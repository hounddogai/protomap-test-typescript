import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightScheduleBatchSizeRangeRule,
  InsightScheduleRequiredChannelRule,
  InsightScheduleReviewerLengthRule,
  InsightScheduleThresholdRangeRule,
  defaultInsightScheduleValidator,
} from "./insight-schedule-rules.js";
import { newInsightSchedule } from "./insight-schedule.js";

test("InsightScheduleValidator reports every problem", () => {
  const validator = defaultInsightScheduleValidator();
  const item = newInsightSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightScheduleRequiredChannelRule flags a blank channel", () => {
  const rule = new InsightScheduleRequiredChannelRule("insight schedule needs this field");
  const item = newInsightSchedule("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightScheduleThresholdRangeRule flags values above threshold", () => {
  const rule = new InsightScheduleThresholdRangeRule(1.9, 3913.7);
  const item = newInsightSchedule("x", "y");
  item.threshold = 3915.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightScheduleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new InsightScheduleBatchSizeRangeRule(16, 64);
  const item = newInsightSchedule("x", "y");
  item.batchSize = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightScheduleReviewerLengthRule flags a long reviewer", () => {
  const rule = new InsightScheduleReviewerLengthRule(86400);
  const item = newInsightSchedule("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
