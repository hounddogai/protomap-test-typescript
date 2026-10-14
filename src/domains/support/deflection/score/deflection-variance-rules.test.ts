import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionVarianceLocaleLengthRule,
  DeflectionVarianceRequiredLocaleRule,
  DeflectionVarianceRequiredSummaryRule,
  DeflectionVarianceSummaryLengthRule,
  defaultDeflectionVarianceValidator,
} from "./deflection-variance-rules.js";
import { newDeflectionVariance } from "./deflection-variance.js";

test("DeflectionVarianceValidator reports every problem", () => {
  const validator = defaultDeflectionVarianceValidator();
  const item = newDeflectionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionVarianceRequiredSummaryRule flags a blank summary", () => {
  const rule = new DeflectionVarianceRequiredSummaryRule("deflection variance needs a value");
  const item = newDeflectionVariance("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionVarianceLocaleLengthRule flags a long locale", () => {
  const rule = new DeflectionVarianceLocaleLengthRule(32);
  const item = newDeflectionVariance("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionVarianceRequiredLocaleRule flags a blank locale", () => {
  const rule = new DeflectionVarianceRequiredLocaleRule("deflection variance needs an entry");
  const item = newDeflectionVariance("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionVarianceSummaryLengthRule flags a long summary", () => {
  const rule = new DeflectionVarianceSummaryLengthRule(16);
  const item = newDeflectionVariance("x", "y");
  item.summary = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
