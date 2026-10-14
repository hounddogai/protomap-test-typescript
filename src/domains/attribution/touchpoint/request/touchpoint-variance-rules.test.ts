import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointVarianceBatchSizeRangeRule,
  TouchpointVarianceFrequencyCapRangeRule,
  TouchpointVarianceRequiredCodeRule,
  TouchpointVarianceSummaryLengthRule,
  defaultTouchpointVarianceValidator,
} from "./touchpoint-variance-rules.js";
import { newTouchpointVariance } from "./touchpoint-variance.js";

test("TouchpointVarianceValidator reports every problem", () => {
  const validator = defaultTouchpointVarianceValidator();
  const item = newTouchpointVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointVarianceFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new TouchpointVarianceFrequencyCapRangeRule(64, 255);
  const item = newTouchpointVariance("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointVarianceRequiredCodeRule("touchpoint variance needs this field");
  const item = newTouchpointVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointVarianceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new TouchpointVarianceBatchSizeRangeRule(120, 86400);
  const item = newTouchpointVariance("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointVarianceSummaryLengthRule flags a long summary", () => {
  const rule = new TouchpointVarianceSummaryLengthRule(64);
  const item = newTouchpointVariance("x", "y");
  item.summary = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
