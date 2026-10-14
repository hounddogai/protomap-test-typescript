import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationVarianceCostRangeRule,
  ActivationVarianceNameLengthRule,
  ActivationVariancePhoneLengthRule,
  ActivationVarianceRequiredNameRule,
  defaultActivationVarianceValidator,
} from "./activation-variance-rules.js";
import { newActivationVariance } from "./activation-variance.js";

test("ActivationVarianceValidator reports every problem", () => {
  const validator = defaultActivationVarianceValidator();
  const item = newActivationVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationVarianceCostRangeRule flags values above cost", () => {
  const rule = new ActivationVarianceCostRangeRule(8.6, 3569.7);
  const item = newActivationVariance("x", "y");
  item.cost = 3571.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationVarianceRequiredNameRule flags a blank name", () => {
  const rule = new ActivationVarianceRequiredNameRule("activation variance needs an entry");
  const item = newActivationVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationVarianceNameLengthRule flags a long name", () => {
  const rule = new ActivationVarianceNameLengthRule(32);
  const item = newActivationVariance("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationVariancePhoneLengthRule flags a long phone", () => {
  const rule = new ActivationVariancePhoneLengthRule(16);
  const item = newActivationVariance("x", "y");
  item.phone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
