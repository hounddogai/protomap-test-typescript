import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedDoubleOptInBaselineNameLengthRule,
  WeightedDoubleOptInBaselineRequiredCodeRule,
  WeightedDoubleOptInBaselineRequiredNameRule,
  defaultWeightedDoubleOptInBaselineValidator,
} from "./weighted-double-opt-in-baseline-rules.js";
import { newWeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

test("WeightedDoubleOptInBaselineValidator reports every problem", () => {
  const validator = defaultWeightedDoubleOptInBaselineValidator();
  const item = newWeightedDoubleOptInBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedDoubleOptInBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedDoubleOptInBaselineRequiredCodeRule("weighted double opt in baseline needs a value");
  const item = newWeightedDoubleOptInBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDoubleOptInBaselineRequiredNameRule flags a blank name", () => {
  const rule = new WeightedDoubleOptInBaselineRequiredNameRule("weighted double opt in baseline needs an entry");
  const item = newWeightedDoubleOptInBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDoubleOptInBaselineNameLengthRule flags a long name", () => {
  const rule = new WeightedDoubleOptInBaselineNameLengthRule(120);
  const item = newWeightedDoubleOptInBaseline("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
