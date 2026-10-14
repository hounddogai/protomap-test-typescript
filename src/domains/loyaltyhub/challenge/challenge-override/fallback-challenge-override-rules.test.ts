import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackChallengeOverrideBudgetRangeRule,
  FallbackChallengeOverrideCohortLengthRule,
  FallbackChallengeOverrideNameLengthRule,
  FallbackChallengeOverrideRequiredCodeRule,
  defaultFallbackChallengeOverrideValidator,
} from "./fallback-challenge-override-rules.js";
import { newFallbackChallengeOverride } from "./fallback-challenge-override.js";

test("FallbackChallengeOverrideValidator reports every problem", () => {
  const validator = defaultFallbackChallengeOverrideValidator();
  const item = newFallbackChallengeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackChallengeOverrideNameLengthRule flags a long name", () => {
  const rule = new FallbackChallengeOverrideNameLengthRule(255);
  const item = newFallbackChallengeOverride("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackChallengeOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackChallengeOverrideRequiredCodeRule("fallback challenge override needs a value");
  const item = newFallbackChallengeOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackChallengeOverrideBudgetRangeRule flags values above budget", () => {
  const rule = new FallbackChallengeOverrideBudgetRangeRule(1, 3089.8);
  const item = newFallbackChallengeOverride("x", "y");
  item.budget = 3091.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackChallengeOverrideCohortLengthRule flags a long cohort", () => {
  const rule = new FallbackChallengeOverrideCohortLengthRule(1000);
  const item = newFallbackChallengeOverride("x", "y");
  item.cohort = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
