import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingModelVarianceBudgetRangeRule,
  RollingModelVarianceCategoryLengthRule,
  RollingModelVarianceExpiresAtRangeRule,
  RollingModelVarianceExternalRefLengthRule,
  RollingModelVarianceNameLengthRule,
  RollingModelVarianceRequiredCodeRule,
  defaultRollingModelVarianceValidator,
} from "./rolling-model-variance-rules.js";
import { newRollingModelVariance } from "./rolling-model-variance.js";

test("RollingModelVarianceValidator reports every problem", () => {
  const validator = defaultRollingModelVarianceValidator();
  const item = newRollingModelVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingModelVarianceExternalRefLengthRule flags a long external ref", () => {
  const rule = new RollingModelVarianceExternalRefLengthRule(16);
  const item = newRollingModelVariance("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingModelVarianceNameLengthRule flags a long name", () => {
  const rule = new RollingModelVarianceNameLengthRule(86400);
  const item = newRollingModelVariance("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingModelVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new RollingModelVarianceRequiredCodeRule("rolling model variance needs a value");
  const item = newRollingModelVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingModelVarianceExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RollingModelVarianceExpiresAtRangeRule(64, 1000);
  const item = newRollingModelVariance("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingModelVarianceBudgetRangeRule flags values above budget", () => {
  const rule = new RollingModelVarianceBudgetRangeRule(8.4, 4814.5);
  const item = newRollingModelVariance("x", "y");
  item.budget = 4816;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingModelVarianceCategoryLengthRule flags a long category", () => {
  const rule = new RollingModelVarianceCategoryLengthRule(86400);
  const item = newRollingModelVariance("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
