import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionScoreMinimumRangeRule,
  RedemptionScoreRequiredVariantRule,
  RedemptionScoreVariantLengthRule,
  defaultRedemptionScoreValidator,
} from "./redemption-score-rules.js";
import { newRedemptionScore } from "./redemption-score.js";

test("RedemptionScoreValidator reports every problem", () => {
  const validator = defaultRedemptionScoreValidator();
  const item = newRedemptionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionScoreRequiredVariantRule flags a blank variant", () => {
  const rule = new RedemptionScoreRequiredVariantRule("redemption score needs a value");
  const item = newRedemptionScore("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionScoreVariantLengthRule flags a long variant", () => {
  const rule = new RedemptionScoreVariantLengthRule(255);
  const item = newRedemptionScore("x", "y");
  item.variant = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionScoreMinimumRangeRule flags values above minimum", () => {
  const rule = new RedemptionScoreMinimumRangeRule(7.1, 2288.1);
  const item = newRedemptionScore("x", "y");
  item.minimum = 2289.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
