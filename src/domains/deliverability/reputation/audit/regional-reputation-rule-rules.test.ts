import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalReputationRuleClicksRangeRule,
  RegionalReputationRuleCurrencyLengthRule,
  RegionalReputationRuleRequiredCurrencyRule,
  RegionalReputationRuleRequiredLabelRule,
  defaultRegionalReputationRuleValidator,
} from "./regional-reputation-rule-rules.js";
import { newRegionalReputationRule } from "./regional-reputation-rule.js";

test("RegionalReputationRuleValidator reports every problem", () => {
  const validator = defaultRegionalReputationRuleValidator();
  const item = newRegionalReputationRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalReputationRuleRequiredCurrencyRule flags a blank currency", () => {
  const rule = new RegionalReputationRuleRequiredCurrencyRule("regional reputation rule needs an entry");
  const item = newRegionalReputationRule("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReputationRuleCurrencyLengthRule flags a long currency", () => {
  const rule = new RegionalReputationRuleCurrencyLengthRule(32);
  const item = newRegionalReputationRule("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalReputationRuleClicksRangeRule flags values above clicks", () => {
  const rule = new RegionalReputationRuleClicksRangeRule(16, 3600);
  const item = newRegionalReputationRule("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalReputationRuleRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalReputationRuleRequiredLabelRule("regional reputation rule needs this field");
  const item = newRegionalReputationRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
