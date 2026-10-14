import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySubscriptionRuleCategoryLengthRule,
  LegacySubscriptionRuleRequiredVariantRule,
  LegacySubscriptionRuleVariantLengthRule,
  defaultLegacySubscriptionRuleValidator,
} from "./legacy-subscription-rule-rules.js";
import { newLegacySubscriptionRule } from "./legacy-subscription-rule.js";

test("LegacySubscriptionRuleValidator reports every problem", () => {
  const validator = defaultLegacySubscriptionRuleValidator();
  const item = newLegacySubscriptionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySubscriptionRuleRequiredVariantRule flags a blank variant", () => {
  const rule = new LegacySubscriptionRuleRequiredVariantRule("legacy subscription rule needs a value");
  const item = newLegacySubscriptionRule("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySubscriptionRuleCategoryLengthRule flags a long category", () => {
  const rule = new LegacySubscriptionRuleCategoryLengthRule(3600);
  const item = newLegacySubscriptionRule("x", "y");
  item.category = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySubscriptionRuleVariantLengthRule flags a long variant", () => {
  const rule = new LegacySubscriptionRuleVariantLengthRule(86400);
  const item = newLegacySubscriptionRule("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
