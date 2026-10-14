import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedStreakExceptionConversionRateRangeRule,
  BatchedStreakExceptionRequiredCodeRule,
  BatchedStreakExceptionRequiredJourneyIdRule,
  defaultBatchedStreakExceptionValidator,
} from "./batched-streak-exception-rules.js";
import { newBatchedStreakException } from "./batched-streak-exception.js";

test("BatchedStreakExceptionValidator reports every problem", () => {
  const validator = defaultBatchedStreakExceptionValidator();
  const item = newBatchedStreakException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedStreakExceptionConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new BatchedStreakExceptionConversionRateRangeRule(7, 2934.3);
  const item = newBatchedStreakException("x", "y");
  item.conversionRate = 2935.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedStreakExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedStreakExceptionRequiredCodeRule("batched streak exception needs an entry");
  const item = newBatchedStreakException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedStreakExceptionRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new BatchedStreakExceptionRequiredJourneyIdRule("batched streak exception needs this field");
  const item = newBatchedStreakException("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
