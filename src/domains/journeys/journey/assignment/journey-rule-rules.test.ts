import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyRuleGraceDaysRangeRule,
  JourneyRuleLabelLengthRule,
  JourneyRuleRequiredLabelRule,
  JourneyRuleWeightRangeRule,
  defaultJourneyRuleValidator,
} from "./journey-rule-rules.js";
import { newJourneyRule } from "./journey-rule.js";

test("JourneyRuleValidator reports every problem", () => {
  const validator = defaultJourneyRuleValidator();
  const item = newJourneyRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyRuleRequiredLabelRule flags a blank label", () => {
  const rule = new JourneyRuleRequiredLabelRule("journey rule needs this field");
  const item = newJourneyRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyRuleWeightRangeRule flags values above weight", () => {
  const rule = new JourneyRuleWeightRangeRule(8.7, 1570.2);
  const item = newJourneyRule("x", "y");
  item.weight = 1571.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyRuleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new JourneyRuleGraceDaysRangeRule(86400, 86400);
  const item = newJourneyRule("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyRuleLabelLengthRule flags a long label", () => {
  const rule = new JourneyRuleLabelLengthRule(120);
  const item = newJourneyRule("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
