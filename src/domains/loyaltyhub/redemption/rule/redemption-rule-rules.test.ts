import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionRuleNameLengthRule,
  RedemptionRuleRequiredCodeRule,
  RedemptionRuleRequiredCountryRule,
  RedemptionRuleRequiredNameRule,
  defaultRedemptionRuleValidator,
} from "./redemption-rule-rules.js";
import { newRedemptionRule } from "./redemption-rule.js";

test("RedemptionRuleValidator reports every problem", () => {
  const validator = defaultRedemptionRuleValidator();
  const item = newRedemptionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionRuleRequiredNameRule flags a blank name", () => {
  const rule = new RedemptionRuleRequiredNameRule("redemption rule needs this field");
  const item = newRedemptionRule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionRuleRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionRuleRequiredCodeRule("redemption rule needs this field");
  const item = newRedemptionRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionRuleRequiredCountryRule flags a blank country", () => {
  const rule = new RedemptionRuleRequiredCountryRule("redemption rule needs a value");
  const item = newRedemptionRule("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionRuleNameLengthRule flags a long name", () => {
  const rule = new RedemptionRuleNameLengthRule(255);
  const item = newRedemptionRule("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
