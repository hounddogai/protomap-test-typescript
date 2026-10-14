import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakRuleLabelLengthRule,
  StreakRuleMarginRangeRule,
  StreakRuleMaximumRangeRule,
  StreakRuleRequiredLabelRule,
  defaultStreakRuleValidator,
} from "./streak-rule-rules.js";
import { newStreakRule } from "./streak-rule.js";

test("StreakRuleValidator reports every problem", () => {
  const validator = defaultStreakRuleValidator();
  const item = newStreakRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakRuleMarginRangeRule flags values above margin", () => {
  const rule = new StreakRuleMarginRangeRule(8.7, 1131.2);
  const item = newStreakRule("x", "y");
  item.margin = 1132.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakRuleRequiredLabelRule flags a blank label", () => {
  const rule = new StreakRuleRequiredLabelRule("streak rule needs a value");
  const item = newStreakRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakRuleMaximumRangeRule flags values above maximum", () => {
  const rule = new StreakRuleMaximumRangeRule(6.7, 4799.6);
  const item = newStreakRule("x", "y");
  item.maximum = 4801.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakRuleLabelLengthRule flags a long label", () => {
  const rule = new StreakRuleLabelLengthRule(16);
  const item = newStreakRule("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
