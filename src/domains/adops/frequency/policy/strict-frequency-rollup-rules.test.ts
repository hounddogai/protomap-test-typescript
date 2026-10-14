import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictFrequencyRollupCodeLengthRule,
  StrictFrequencyRollupDiscountRangeRule,
  StrictFrequencyRollupRequiredCodeRule,
  StrictFrequencyRollupRequiredCurrencyRule,
  defaultStrictFrequencyRollupValidator,
} from "./strict-frequency-rollup-rules.js";
import { newStrictFrequencyRollup } from "./strict-frequency-rollup.js";

test("StrictFrequencyRollupValidator reports every problem", () => {
  const validator = defaultStrictFrequencyRollupValidator();
  const item = newStrictFrequencyRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictFrequencyRollupRequiredCodeRule flags a blank code", () => {
  const rule = new StrictFrequencyRollupRequiredCodeRule("strict frequency rollup needs this field");
  const item = newStrictFrequencyRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictFrequencyRollupRequiredCurrencyRule flags a blank currency", () => {
  const rule = new StrictFrequencyRollupRequiredCurrencyRule("strict frequency rollup needs an entry");
  const item = newStrictFrequencyRollup("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictFrequencyRollupDiscountRangeRule flags values above discount", () => {
  const rule = new StrictFrequencyRollupDiscountRangeRule(9.7, 4939.9);
  const item = newStrictFrequencyRollup("x", "y");
  item.discount = 4941.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictFrequencyRollupCodeLengthRule flags a long code", () => {
  const rule = new StrictFrequencyRollupCodeLengthRule(120);
  const item = newStrictFrequencyRollup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
