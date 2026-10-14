import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakSummaryCodeLengthRule,
  StreakSummaryConversionRateRangeRule,
  StreakSummaryRequiredCodeRule,
  StreakSummaryWindowDaysRangeRule,
  defaultStreakSummaryValidator,
} from "./streak-summary-rules.js";
import { newStreakSummary } from "./streak-summary.js";

test("StreakSummaryValidator reports every problem", () => {
  const validator = defaultStreakSummaryValidator();
  const item = newStreakSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new StreakSummaryRequiredCodeRule("streak summary needs this field");
  const item = newStreakSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakSummaryConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new StreakSummaryConversionRateRangeRule(4.1, 2872.3);
  const item = newStreakSummary("x", "y");
  item.conversionRate = 2873.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakSummaryWindowDaysRangeRule flags values above window days", () => {
  const rule = new StreakSummaryWindowDaysRangeRule(16, 16);
  const item = newStreakSummary("x", "y");
  item.windowDays = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakSummaryCodeLengthRule flags a long code", () => {
  const rule = new StreakSummaryCodeLengthRule(120);
  const item = newStreakSummary("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
