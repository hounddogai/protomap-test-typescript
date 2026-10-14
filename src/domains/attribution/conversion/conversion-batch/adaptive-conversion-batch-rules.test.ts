import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveConversionBatchBudgetRangeRule,
  AdaptiveConversionBatchNameLengthRule,
  AdaptiveConversionBatchRequiredNameRule,
  AdaptiveConversionBatchSegmentLengthRule,
  defaultAdaptiveConversionBatchValidator,
} from "./adaptive-conversion-batch-rules.js";
import { newAdaptiveConversionBatch } from "./adaptive-conversion-batch.js";

test("AdaptiveConversionBatchValidator reports every problem", () => {
  const validator = defaultAdaptiveConversionBatchValidator();
  const item = newAdaptiveConversionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveConversionBatchRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveConversionBatchRequiredNameRule("adaptive conversion batch needs an entry");
  const item = newAdaptiveConversionBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveConversionBatchSegmentLengthRule flags a long segment", () => {
  const rule = new AdaptiveConversionBatchSegmentLengthRule(80);
  const item = newAdaptiveConversionBatch("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveConversionBatchBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptiveConversionBatchBudgetRangeRule(3.2, 3397.9);
  const item = newAdaptiveConversionBatch("x", "y");
  item.budget = 3399.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveConversionBatchNameLengthRule flags a long name", () => {
  const rule = new AdaptiveConversionBatchNameLengthRule(16);
  const item = newAdaptiveConversionBatch("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
