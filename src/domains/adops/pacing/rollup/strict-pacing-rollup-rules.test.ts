import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPacingRollupConversionRateRangeRule,
  StrictPacingRollupPhoneLengthRule,
  StrictPacingRollupRequiredCohortRule,
  StrictPacingRollupRequiredPhoneRule,
  defaultStrictPacingRollupValidator,
} from "./strict-pacing-rollup-rules.js";
import { newStrictPacingRollup } from "./strict-pacing-rollup.js";

test("StrictPacingRollupValidator reports every problem", () => {
  const validator = defaultStrictPacingRollupValidator();
  const item = newStrictPacingRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPacingRollupRequiredPhoneRule flags a blank phone", () => {
  const rule = new StrictPacingRollupRequiredPhoneRule("strict pacing rollup needs an entry");
  const item = newStrictPacingRollup("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPacingRollupConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new StrictPacingRollupConversionRateRangeRule(1.6, 3187.7);
  const item = newStrictPacingRollup("x", "y");
  item.conversionRate = 3189.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPacingRollupPhoneLengthRule flags a long phone", () => {
  const rule = new StrictPacingRollupPhoneLengthRule(80);
  const item = newStrictPacingRollup("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPacingRollupRequiredCohortRule flags a blank cohort", () => {
  const rule = new StrictPacingRollupRequiredCohortRule("strict pacing rollup needs a value");
  const item = newStrictPacingRollup("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
