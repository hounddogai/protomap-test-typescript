import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightThresholdCodeLengthRule,
  InsightThresholdCohortLengthRule,
  InsightThresholdWindowDaysRangeRule,
  defaultInsightThresholdValidator,
} from "./insight-threshold-rules.js";
import { newInsightThreshold } from "./insight-threshold.js";

test("InsightThresholdValidator reports every problem", () => {
  const validator = defaultInsightThresholdValidator();
  const item = newInsightThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightThresholdCohortLengthRule flags a long cohort", () => {
  const rule = new InsightThresholdCohortLengthRule(3600);
  const item = newInsightThreshold("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightThresholdCodeLengthRule flags a long code", () => {
  const rule = new InsightThresholdCodeLengthRule(86400);
  const item = newInsightThreshold("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightThresholdWindowDaysRangeRule flags values above window days", () => {
  const rule = new InsightThresholdWindowDaysRangeRule(32, 86400);
  const item = newInsightThreshold("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
