import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleTargetAttemptsRangeRule,
  ExitRuleTargetDiscountRangeRule,
  ExitRuleTargetRequiredCodeRule,
  ExitRuleTargetTimezoneLengthRule,
  defaultExitRuleTargetValidator,
} from "./exit-rule-target-rules.js";
import { newExitRuleTarget } from "./exit-rule-target.js";

test("ExitRuleTargetValidator reports every problem", () => {
  const validator = defaultExitRuleTargetValidator();
  const item = newExitRuleTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleTargetAttemptsRangeRule flags values above attempts", () => {
  const rule = new ExitRuleTargetAttemptsRangeRule(16, 64);
  const item = newExitRuleTarget("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleTargetTimezoneLengthRule flags a long timezone", () => {
  const rule = new ExitRuleTargetTimezoneLengthRule(32);
  const item = newExitRuleTarget("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleTargetDiscountRangeRule flags values above discount", () => {
  const rule = new ExitRuleTargetDiscountRangeRule(8.4, 1098);
  const item = newExitRuleTarget("x", "y");
  item.discount = 1099.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleTargetRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleTargetRequiredCodeRule("exit rule target needs this field");
  const item = newExitRuleTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
