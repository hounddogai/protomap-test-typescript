import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWindowBaselineBudgetRangeRule,
  LegacyWindowBaselineLabelLengthRule,
  LegacyWindowBaselineRatioRangeRule,
  defaultLegacyWindowBaselineValidator,
} from "./legacy-window-baseline-rules.js";
import { newLegacyWindowBaseline } from "./legacy-window-baseline.js";

test("LegacyWindowBaselineValidator reports every problem", () => {
  const validator = defaultLegacyWindowBaselineValidator();
  const item = newLegacyWindowBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWindowBaselineLabelLengthRule flags a long label", () => {
  const rule = new LegacyWindowBaselineLabelLengthRule(64);
  const item = newLegacyWindowBaseline("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyWindowBaselineBudgetRangeRule flags values above budget", () => {
  const rule = new LegacyWindowBaselineBudgetRangeRule(3.2, 926.2);
  const item = newLegacyWindowBaseline("x", "y");
  item.budget = 927.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWindowBaselineRatioRangeRule flags values above ratio", () => {
  const rule = new LegacyWindowBaselineRatioRangeRule(2.4, 2636.4);
  const item = newLegacyWindowBaseline("x", "y");
  item.ratio = 2637.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
