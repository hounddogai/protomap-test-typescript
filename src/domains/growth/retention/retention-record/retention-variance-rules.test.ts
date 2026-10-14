import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionVarianceLabelLengthRule,
  RetentionVarianceRateRangeRule,
  RetentionVarianceRequiredCodeRule,
  RetentionVarianceSegmentLengthRule,
  RetentionVarianceUpdatedAtRangeRule,
  defaultRetentionVarianceValidator,
} from "./retention-variance-rules.js";
import { newRetentionVariance } from "./retention-variance.js";

test("RetentionVarianceValidator reports every problem", () => {
  const validator = defaultRetentionVarianceValidator();
  const item = newRetentionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionVarianceRequiredCodeRule("retention variance needs this field");
  const item = newRetentionVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionVarianceLabelLengthRule flags a long label", () => {
  const rule = new RetentionVarianceLabelLengthRule(255);
  const item = newRetentionVariance("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionVarianceSegmentLengthRule flags a long segment", () => {
  const rule = new RetentionVarianceSegmentLengthRule(3600);
  const item = newRetentionVariance("x", "y");
  item.segment = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionVarianceUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RetentionVarianceUpdatedAtRangeRule(3600, 86400);
  const item = newRetentionVariance("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionVarianceRateRangeRule flags values above rate", () => {
  const rule = new RetentionVarianceRateRangeRule(7.5, 1703.7);
  const item = newRetentionVariance("x", "y");
  item.rate = 1705.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
