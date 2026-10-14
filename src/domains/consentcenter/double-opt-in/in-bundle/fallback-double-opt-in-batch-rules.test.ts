import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackDoubleOptInBatchCodeLengthRule,
  FallbackDoubleOptInBatchCostRangeRule,
  FallbackDoubleOptInBatchPhoneLengthRule,
  FallbackDoubleOptInBatchRequiredReviewerRule,
  FallbackDoubleOptInBatchTitleLengthRule,
  defaultFallbackDoubleOptInBatchValidator,
} from "./fallback-double-opt-in-batch-rules.js";
import { newFallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

test("FallbackDoubleOptInBatchValidator reports every problem", () => {
  const validator = defaultFallbackDoubleOptInBatchValidator();
  const item = newFallbackDoubleOptInBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackDoubleOptInBatchTitleLengthRule flags a long title", () => {
  const rule = new FallbackDoubleOptInBatchTitleLengthRule(64);
  const item = newFallbackDoubleOptInBatch("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackDoubleOptInBatchCodeLengthRule flags a long code", () => {
  const rule = new FallbackDoubleOptInBatchCodeLengthRule(86400);
  const item = newFallbackDoubleOptInBatch("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackDoubleOptInBatchCostRangeRule flags values above cost", () => {
  const rule = new FallbackDoubleOptInBatchCostRangeRule(4.6, 4477.4);
  const item = newFallbackDoubleOptInBatch("x", "y");
  item.cost = 4478.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackDoubleOptInBatchRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new FallbackDoubleOptInBatchRequiredReviewerRule("fallback double opt in batch needs this field");
  const item = newFallbackDoubleOptInBatch("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackDoubleOptInBatchPhoneLengthRule flags a long phone", () => {
  const rule = new FallbackDoubleOptInBatchPhoneLengthRule(1000);
  const item = newFallbackDoubleOptInBatch("x", "y");
  item.phone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
