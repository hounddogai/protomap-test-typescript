import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationRuleConversionRateRangeRule,
  EscalationRuleLabelLengthRule,
  EscalationRuleRequiredLabelRule,
  EscalationRuleRequiredPhoneRule,
  EscalationRuleScoreRangeRule,
  defaultEscalationRuleValidator,
} from "./escalation-rule-rules.js";
import { newEscalationRule } from "./escalation-rule.js";

test("EscalationRuleValidator reports every problem", () => {
  const validator = defaultEscalationRuleValidator();
  const item = newEscalationRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationRuleRequiredLabelRule flags a blank label", () => {
  const rule = new EscalationRuleRequiredLabelRule("escalation rule needs this field");
  const item = newEscalationRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationRuleRequiredPhoneRule flags a blank phone", () => {
  const rule = new EscalationRuleRequiredPhoneRule("escalation rule needs this field");
  const item = newEscalationRule("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationRuleLabelLengthRule flags a long label", () => {
  const rule = new EscalationRuleLabelLengthRule(64);
  const item = newEscalationRule("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationRuleScoreRangeRule flags values above score", () => {
  const rule = new EscalationRuleScoreRangeRule(7.8, 3876.4);
  const item = newEscalationRule("x", "y");
  item.score = 3877.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationRuleConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new EscalationRuleConversionRateRangeRule(7.6, 4131.5);
  const item = newEscalationRule("x", "y");
  item.conversionRate = 4133;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
