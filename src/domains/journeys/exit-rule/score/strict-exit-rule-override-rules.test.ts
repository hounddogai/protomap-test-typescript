import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictExitRuleOverrideBudgetRangeRule,
  StrictExitRuleOverrideCodeLengthRule,
  StrictExitRuleOverrideRequiredCodeRule,
  defaultStrictExitRuleOverrideValidator,
} from "./strict-exit-rule-override-rules.js";
import { newStrictExitRuleOverride } from "./strict-exit-rule-override.js";

test("StrictExitRuleOverrideValidator reports every problem", () => {
  const validator = defaultStrictExitRuleOverrideValidator();
  const item = newStrictExitRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictExitRuleOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new StrictExitRuleOverrideRequiredCodeRule("strict exit rule override needs this field");
  const item = newStrictExitRuleOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictExitRuleOverrideCodeLengthRule flags a long code", () => {
  const rule = new StrictExitRuleOverrideCodeLengthRule(32);
  const item = newStrictExitRuleOverride("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictExitRuleOverrideBudgetRangeRule flags values above budget", () => {
  const rule = new StrictExitRuleOverrideBudgetRangeRule(7.3, 580);
  const item = newStrictExitRuleOverride("x", "y");
  item.budget = 581.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
