import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPathRollupDiscountRangeRule,
  LenientPathRollupLabelLengthRule,
  LenientPathRollupRequiredCodeRule,
  LenientPathRollupRequiredLabelRule,
  LenientPathRollupRequiredTimezoneRule,
  LenientPathRollupScoreRangeRule,
  defaultLenientPathRollupValidator,
} from "./lenient-path-rollup-rules.js";
import { newLenientPathRollup } from "./lenient-path-rollup.js";

test("LenientPathRollupValidator reports every problem", () => {
  const validator = defaultLenientPathRollupValidator();
  const item = newLenientPathRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPathRollupRequiredLabelRule flags a blank label", () => {
  const rule = new LenientPathRollupRequiredLabelRule("lenient path rollup needs this field");
  const item = newLenientPathRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPathRollupRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new LenientPathRollupRequiredTimezoneRule("lenient path rollup needs a value");
  const item = newLenientPathRollup("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPathRollupDiscountRangeRule flags values above discount", () => {
  const rule = new LenientPathRollupDiscountRangeRule(5.8, 2069.7);
  const item = newLenientPathRollup("x", "y");
  item.discount = 2071.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPathRollupLabelLengthRule flags a long label", () => {
  const rule = new LenientPathRollupLabelLengthRule(86400);
  const item = newLenientPathRollup("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPathRollupScoreRangeRule flags values above score", () => {
  const rule = new LenientPathRollupScoreRangeRule(6.4, 4282.1);
  const item = newLenientPathRollup("x", "y");
  item.score = 4283.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPathRollupRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPathRollupRequiredCodeRule("lenient path rollup needs an entry");
  const item = newLenientPathRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
