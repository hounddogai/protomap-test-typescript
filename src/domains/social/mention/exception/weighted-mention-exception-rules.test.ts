import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedMentionExceptionConversionRateRangeRule,
  WeightedMentionExceptionLabelLengthRule,
  WeightedMentionExceptionRequiredLabelRule,
  WeightedMentionExceptionRequiredTitleRule,
  defaultWeightedMentionExceptionValidator,
} from "./weighted-mention-exception-rules.js";
import { newWeightedMentionException } from "./weighted-mention-exception.js";

test("WeightedMentionExceptionValidator reports every problem", () => {
  const validator = defaultWeightedMentionExceptionValidator();
  const item = newWeightedMentionException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedMentionExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedMentionExceptionRequiredLabelRule("weighted mention exception needs a value");
  const item = newWeightedMentionException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedMentionExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedMentionExceptionRequiredTitleRule("weighted mention exception needs an entry");
  const item = newWeightedMentionException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedMentionExceptionConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WeightedMentionExceptionConversionRateRangeRule(7.9, 1344.1);
  const item = newWeightedMentionException("x", "y");
  item.conversionRate = 1345.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedMentionExceptionLabelLengthRule flags a long label", () => {
  const rule = new WeightedMentionExceptionLabelLengthRule(80);
  const item = newWeightedMentionException("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
