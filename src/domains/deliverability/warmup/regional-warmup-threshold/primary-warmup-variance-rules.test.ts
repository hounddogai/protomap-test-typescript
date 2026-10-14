import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryWarmupVarianceAttemptsRangeRule,
  PrimaryWarmupVarianceNameLengthRule,
  PrimaryWarmupVarianceRequiredLocaleRule,
  PrimaryWarmupVarianceRequiredNameRule,
  defaultPrimaryWarmupVarianceValidator,
} from "./primary-warmup-variance-rules.js";
import { newPrimaryWarmupVariance } from "./primary-warmup-variance.js";

test("PrimaryWarmupVarianceValidator reports every problem", () => {
  const validator = defaultPrimaryWarmupVarianceValidator();
  const item = newPrimaryWarmupVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryWarmupVarianceAttemptsRangeRule flags values above attempts", () => {
  const rule = new PrimaryWarmupVarianceAttemptsRangeRule(64, 1000);
  const item = newPrimaryWarmupVariance("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryWarmupVarianceNameLengthRule flags a long name", () => {
  const rule = new PrimaryWarmupVarianceNameLengthRule(64);
  const item = newPrimaryWarmupVariance("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryWarmupVarianceRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryWarmupVarianceRequiredNameRule("primary warmup variance needs this field");
  const item = newPrimaryWarmupVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryWarmupVarianceRequiredLocaleRule flags a blank locale", () => {
  const rule = new PrimaryWarmupVarianceRequiredLocaleRule("primary warmup variance needs a value");
  const item = newPrimaryWarmupVariance("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
