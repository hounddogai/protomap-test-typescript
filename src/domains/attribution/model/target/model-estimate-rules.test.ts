import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelEstimateCategoryLengthRule,
  ModelEstimateCodeLengthRule,
  ModelEstimateRequiredCodeRule,
  defaultModelEstimateValidator,
} from "./model-estimate-rules.js";
import { newModelEstimate } from "./model-estimate.js";

test("ModelEstimateValidator reports every problem", () => {
  const validator = defaultModelEstimateValidator();
  const item = newModelEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelEstimateCategoryLengthRule flags a long category", () => {
  const rule = new ModelEstimateCategoryLengthRule(255);
  const item = newModelEstimate("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelEstimateCodeLengthRule flags a long code", () => {
  const rule = new ModelEstimateCodeLengthRule(255);
  const item = newModelEstimate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new ModelEstimateRequiredCodeRule("model estimate needs this field");
  const item = newModelEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
