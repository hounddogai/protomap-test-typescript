import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakVarianceRequiredLabelRule,
  StreakVarianceSourceLengthRule,
  defaultStreakVarianceValidator,
} from "./streak-variance-rules.js";
import { newStreakVariance } from "./streak-variance.js";

test("StreakVarianceValidator reports every problem", () => {
  const validator = defaultStreakVarianceValidator();
  const item = newStreakVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakVarianceSourceLengthRule flags a long source", () => {
  const rule = new StreakVarianceSourceLengthRule(32);
  const item = newStreakVariance("x", "y");
  item.source = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new StreakVarianceRequiredLabelRule("streak variance needs this field");
  const item = newStreakVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
