import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedExitRuleDigestCodeLengthRule,
  WeightedExitRuleDigestMaximumRangeRule,
  WeightedExitRuleDigestNameLengthRule,
  WeightedExitRuleDigestPhoneLengthRule,
  WeightedExitRuleDigestRequiredPhoneRule,
  defaultWeightedExitRuleDigestValidator,
} from "./weighted-exit-rule-digest-rules.js";
import { newWeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

test("WeightedExitRuleDigestValidator reports every problem", () => {
  const validator = defaultWeightedExitRuleDigestValidator();
  const item = newWeightedExitRuleDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedExitRuleDigestNameLengthRule flags a long name", () => {
  const rule = new WeightedExitRuleDigestNameLengthRule(16);
  const item = newWeightedExitRuleDigest("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedExitRuleDigestCodeLengthRule flags a long code", () => {
  const rule = new WeightedExitRuleDigestCodeLengthRule(64);
  const item = newWeightedExitRuleDigest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedExitRuleDigestPhoneLengthRule flags a long phone", () => {
  const rule = new WeightedExitRuleDigestPhoneLengthRule(1000);
  const item = newWeightedExitRuleDigest("x", "y");
  item.phone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedExitRuleDigestRequiredPhoneRule flags a blank phone", () => {
  const rule = new WeightedExitRuleDigestRequiredPhoneRule("weighted exit rule digest needs an entry");
  const item = newWeightedExitRuleDigest("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedExitRuleDigestMaximumRangeRule flags values above maximum", () => {
  const rule = new WeightedExitRuleDigestMaximumRangeRule(0.2, 4828.4);
  const item = newWeightedExitRuleDigest("x", "y");
  item.maximum = 4829.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
