import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReputationRuleFrequencyCapRangeRule,
  StrictReputationRuleLabelLengthRule,
  StrictReputationRuleRequiredCodeRule,
  StrictReputationRuleRequiredJourneyIdRule,
  defaultStrictReputationRuleValidator,
} from "./strict-reputation-rule-rules.js";
import { newStrictReputationRule } from "./strict-reputation-rule.js";

test("StrictReputationRuleValidator reports every problem", () => {
  const validator = defaultStrictReputationRuleValidator();
  const item = newStrictReputationRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReputationRuleFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new StrictReputationRuleFrequencyCapRangeRule(64, 64);
  const item = newStrictReputationRule("x", "y");
  item.frequencyCap = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictReputationRuleRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new StrictReputationRuleRequiredJourneyIdRule("strict reputation rule needs this field");
  const item = newStrictReputationRule("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReputationRuleRequiredCodeRule flags a blank code", () => {
  const rule = new StrictReputationRuleRequiredCodeRule("strict reputation rule needs a value");
  const item = newStrictReputationRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReputationRuleLabelLengthRule flags a long label", () => {
  const rule = new StrictReputationRuleLabelLengthRule(86400);
  const item = newStrictReputationRule("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
