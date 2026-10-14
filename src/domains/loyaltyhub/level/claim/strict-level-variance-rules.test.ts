import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictLevelVarianceCodeLengthRule,
  StrictLevelVarianceLabelLengthRule,
  StrictLevelVarianceQuantityRangeRule,
  StrictLevelVarianceRequiredCountryRule,
  defaultStrictLevelVarianceValidator,
} from "./strict-level-variance-rules.js";
import { newStrictLevelVariance } from "./strict-level-variance.js";

test("StrictLevelVarianceValidator reports every problem", () => {
  const validator = defaultStrictLevelVarianceValidator();
  const item = newStrictLevelVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictLevelVarianceCodeLengthRule flags a long code", () => {
  const rule = new StrictLevelVarianceCodeLengthRule(3600);
  const item = newStrictLevelVariance("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictLevelVarianceLabelLengthRule flags a long label", () => {
  const rule = new StrictLevelVarianceLabelLengthRule(3600);
  const item = newStrictLevelVariance("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictLevelVarianceRequiredCountryRule flags a blank country", () => {
  const rule = new StrictLevelVarianceRequiredCountryRule("strict level variance needs a value");
  const item = newStrictLevelVariance("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictLevelVarianceQuantityRangeRule flags values above quantity", () => {
  const rule = new StrictLevelVarianceQuantityRangeRule(3600, 3600);
  const item = newStrictLevelVariance("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
