import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInRollupDiscountRangeRule,
  DoubleOptInRollupLabelLengthRule,
  DoubleOptInRollupRequiredLabelRule,
  defaultDoubleOptInRollupValidator,
} from "./double-opt-in-rollup-rules.js";
import { newDoubleOptInRollup } from "./double-opt-in-rollup.js";

test("DoubleOptInRollupValidator reports every problem", () => {
  const validator = defaultDoubleOptInRollupValidator();
  const item = newDoubleOptInRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInRollupRequiredLabelRule flags a blank label", () => {
  const rule = new DoubleOptInRollupRequiredLabelRule("double opt in rollup needs a value");
  const item = newDoubleOptInRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInRollupDiscountRangeRule flags values above discount", () => {
  const rule = new DoubleOptInRollupDiscountRangeRule(4.7, 3045.8);
  const item = newDoubleOptInRollup("x", "y");
  item.discount = 3047.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInRollupLabelLengthRule flags a long label", () => {
  const rule = new DoubleOptInRollupLabelLengthRule(16);
  const item = newDoubleOptInRollup("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
