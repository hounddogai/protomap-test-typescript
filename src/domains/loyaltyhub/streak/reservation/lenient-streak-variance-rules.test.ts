import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientStreakVarianceBudgetRangeRule,
  LenientStreakVarianceOwnerIdLengthRule,
  LenientStreakVarianceRequiredOwnerIdRule,
  LenientStreakVarianceRequiredTitleRule,
  defaultLenientStreakVarianceValidator,
} from "./lenient-streak-variance-rules.js";
import { newLenientStreakVariance } from "./lenient-streak-variance.js";

test("LenientStreakVarianceValidator reports every problem", () => {
  const validator = defaultLenientStreakVarianceValidator();
  const item = newLenientStreakVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientStreakVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new LenientStreakVarianceRequiredTitleRule("lenient streak variance needs an entry");
  const item = newLenientStreakVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakVarianceBudgetRangeRule flags values above budget", () => {
  const rule = new LenientStreakVarianceBudgetRangeRule(6.7, 3669.9);
  const item = newLenientStreakVariance("x", "y");
  item.budget = 3671.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientStreakVarianceOwnerIdLengthRule flags a long owner id", () => {
  const rule = new LenientStreakVarianceOwnerIdLengthRule(16);
  const item = newLenientStreakVariance("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientStreakVarianceRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LenientStreakVarianceRequiredOwnerIdRule("lenient streak variance needs a value");
  const item = newLenientStreakVariance("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
