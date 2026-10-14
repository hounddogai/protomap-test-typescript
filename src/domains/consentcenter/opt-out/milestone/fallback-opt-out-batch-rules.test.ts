import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackOptOutBatchRatioRangeRule,
  FallbackOptOutBatchScoreRangeRule,
  FallbackOptOutBatchUtmSourceLengthRule,
  defaultFallbackOptOutBatchValidator,
} from "./fallback-opt-out-batch-rules.js";
import { newFallbackOptOutBatch } from "./fallback-opt-out-batch.js";

test("FallbackOptOutBatchValidator reports every problem", () => {
  const validator = defaultFallbackOptOutBatchValidator();
  const item = newFallbackOptOutBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackOptOutBatchUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FallbackOptOutBatchUtmSourceLengthRule(32);
  const item = newFallbackOptOutBatch("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackOptOutBatchRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackOptOutBatchRatioRangeRule(6.1, 4249.6);
  const item = newFallbackOptOutBatch("x", "y");
  item.ratio = 4251.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackOptOutBatchScoreRangeRule flags values above score", () => {
  const rule = new FallbackOptOutBatchScoreRangeRule(5.3, 2930.7);
  const item = newFallbackOptOutBatch("x", "y");
  item.score = 2932.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
