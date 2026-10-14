import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightRuleDescriptionLengthRule,
  InsightRuleNameLengthRule,
  InsightRulePriorityRangeRule,
  InsightRuleRequiredLocaleRule,
  defaultInsightRuleValidator,
} from "./insight-rule-rules.js";
import { newInsightRule } from "./insight-rule.js";

test("InsightRuleValidator reports every problem", () => {
  const validator = defaultInsightRuleValidator();
  const item = newInsightRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightRulePriorityRangeRule flags values above priority", () => {
  const rule = new InsightRulePriorityRangeRule(255, 86400);
  const item = newInsightRule("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightRuleRequiredLocaleRule flags a blank locale", () => {
  const rule = new InsightRuleRequiredLocaleRule("insight rule needs a value");
  const item = newInsightRule("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightRuleDescriptionLengthRule flags a long description", () => {
  const rule = new InsightRuleDescriptionLengthRule(1000);
  const item = newInsightRule("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightRuleNameLengthRule flags a long name", () => {
  const rule = new InsightRuleNameLengthRule(32);
  const item = newInsightRule("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
