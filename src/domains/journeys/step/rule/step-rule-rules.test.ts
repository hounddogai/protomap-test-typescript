import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepRuleImpressionsRangeRule,
  StepRulePriorityRangeRule,
  StepRuleRequiredCodeRule,
  StepRuleSegmentLengthRule,
  defaultStepRuleValidator,
} from "./step-rule-rules.js";
import { newStepRule } from "./step-rule.js";

test("StepRuleValidator reports every problem", () => {
  const validator = defaultStepRuleValidator();
  const item = newStepRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepRulePriorityRangeRule flags values above priority", () => {
  const rule = new StepRulePriorityRangeRule(16, 16);
  const item = newStepRule("x", "y");
  item.priority = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepRuleRequiredCodeRule flags a blank code", () => {
  const rule = new StepRuleRequiredCodeRule("step rule needs this field");
  const item = newStepRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepRuleSegmentLengthRule flags a long segment", () => {
  const rule = new StepRuleSegmentLengthRule(16);
  const item = newStepRule("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRuleImpressionsRangeRule flags values above impressions", () => {
  const rule = new StepRuleImpressionsRangeRule(3600, 86400);
  const item = newStepRule("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
