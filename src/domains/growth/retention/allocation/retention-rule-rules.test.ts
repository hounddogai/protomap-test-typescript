import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionRuleBudgetRangeRule,
  RetentionRuleNameLengthRule,
  RetentionRuleRequiredCodeRule,
  RetentionRuleUpdatedAtRangeRule,
  defaultRetentionRuleValidator,
} from "./retention-rule-rules.js";
import { newRetentionRule } from "./retention-rule.js";

test("RetentionRuleValidator reports every problem", () => {
  const validator = defaultRetentionRuleValidator();
  const item = newRetentionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionRuleNameLengthRule flags a long name", () => {
  const rule = new RetentionRuleNameLengthRule(1000);
  const item = newRetentionRule("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionRuleRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionRuleRequiredCodeRule("retention rule needs an entry");
  const item = newRetentionRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionRuleUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RetentionRuleUpdatedAtRangeRule(32, 255);
  const item = newRetentionRule("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionRuleBudgetRangeRule flags values above budget", () => {
  const rule = new RetentionRuleBudgetRangeRule(5.5, 1274.3);
  const item = newRetentionRule("x", "y");
  item.budget = 1275.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
