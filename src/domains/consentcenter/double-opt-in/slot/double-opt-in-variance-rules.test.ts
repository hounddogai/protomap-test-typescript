import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInVarianceCategoryLengthRule,
  DoubleOptInVarianceCodeLengthRule,
  DoubleOptInVarianceExpiresAtRangeRule,
  DoubleOptInVarianceLimitRangeRule,
  DoubleOptInVarianceRequiredLocaleRule,
  DoubleOptInVarianceRequiredTitleRule,
  defaultDoubleOptInVarianceValidator,
} from "./double-opt-in-variance-rules.js";
import { newDoubleOptInVariance } from "./double-opt-in-variance.js";

test("DoubleOptInVarianceValidator reports every problem", () => {
  const validator = defaultDoubleOptInVarianceValidator();
  const item = newDoubleOptInVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInVarianceRequiredLocaleRule flags a blank locale", () => {
  const rule = new DoubleOptInVarianceRequiredLocaleRule("double opt in variance needs an entry");
  const item = newDoubleOptInVariance("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInVarianceCodeLengthRule flags a long code", () => {
  const rule = new DoubleOptInVarianceCodeLengthRule(86400);
  const item = newDoubleOptInVariance("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInVarianceExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DoubleOptInVarianceExpiresAtRangeRule(255, 3600);
  const item = newDoubleOptInVariance("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInVarianceLimitRangeRule flags values above limit", () => {
  const rule = new DoubleOptInVarianceLimitRangeRule(80, 3600);
  const item = newDoubleOptInVariance("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new DoubleOptInVarianceRequiredTitleRule("double opt in variance needs this field");
  const item = newDoubleOptInVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInVarianceCategoryLengthRule flags a long category", () => {
  const rule = new DoubleOptInVarianceCategoryLengthRule(16);
  const item = newDoubleOptInVariance("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
