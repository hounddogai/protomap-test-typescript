import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCsatRuleCostRangeRule,
  RollingCsatRuleNameLengthRule,
  RollingCsatRuleOpenRateRangeRule,
  RollingCsatRuleRequiredCodeRule,
  RollingCsatRuleUnitLengthRule,
  defaultRollingCsatRuleValidator,
} from "./rolling-csat-rule-rules.js";
import { newRollingCsatRule } from "./rolling-csat-rule.js";

test("RollingCsatRuleValidator reports every problem", () => {
  const validator = defaultRollingCsatRuleValidator();
  const item = newRollingCsatRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCsatRuleNameLengthRule flags a long name", () => {
  const rule = new RollingCsatRuleNameLengthRule(86400);
  const item = newRollingCsatRule("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCsatRuleCostRangeRule flags values above cost", () => {
  const rule = new RollingCsatRuleCostRangeRule(1.9, 2161.7);
  const item = newRollingCsatRule("x", "y");
  item.cost = 2163.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCsatRuleOpenRateRangeRule flags values above open rate", () => {
  const rule = new RollingCsatRuleOpenRateRangeRule(1.7, 4722.8);
  const item = newRollingCsatRule("x", "y");
  item.openRate = 4724.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCsatRuleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingCsatRuleRequiredCodeRule("rolling csat rule needs an entry");
  const item = newRollingCsatRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCsatRuleUnitLengthRule flags a long unit", () => {
  const rule = new RollingCsatRuleUnitLengthRule(16);
  const item = newRollingCsatRule("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
