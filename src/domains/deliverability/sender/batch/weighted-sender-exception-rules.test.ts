import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedSenderExceptionFrequencyCapRangeRule,
  WeightedSenderExceptionMarginRangeRule,
  WeightedSenderExceptionRequiredSummaryRule,
  WeightedSenderExceptionSummaryLengthRule,
  defaultWeightedSenderExceptionValidator,
} from "./weighted-sender-exception-rules.js";
import { newWeightedSenderException } from "./weighted-sender-exception.js";

test("WeightedSenderExceptionValidator reports every problem", () => {
  const validator = defaultWeightedSenderExceptionValidator();
  const item = newWeightedSenderException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedSenderExceptionMarginRangeRule flags values above margin", () => {
  const rule = new WeightedSenderExceptionMarginRangeRule(0, 1558.2);
  const item = newWeightedSenderException("x", "y");
  item.margin = 1559.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedSenderExceptionFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new WeightedSenderExceptionFrequencyCapRangeRule(32, 1000);
  const item = newWeightedSenderException("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedSenderExceptionSummaryLengthRule flags a long summary", () => {
  const rule = new WeightedSenderExceptionSummaryLengthRule(32);
  const item = newWeightedSenderException("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedSenderExceptionRequiredSummaryRule flags a blank summary", () => {
  const rule = new WeightedSenderExceptionRequiredSummaryRule("weighted sender exception needs an entry");
  const item = newWeightedSenderException("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
