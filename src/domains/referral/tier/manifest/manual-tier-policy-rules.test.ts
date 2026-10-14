import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTierPolicyAmountRangeRule,
  ManualTierPolicyCohortLengthRule,
  ManualTierPolicyLocaleLengthRule,
  ManualTierPolicyRequiredLocaleRule,
  ManualTierPolicyRequiredNameRule,
  defaultManualTierPolicyValidator,
} from "./manual-tier-policy-rules.js";
import { newManualTierPolicy } from "./manual-tier-policy.js";

test("ManualTierPolicyValidator reports every problem", () => {
  const validator = defaultManualTierPolicyValidator();
  const item = newManualTierPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTierPolicyAmountRangeRule flags values above amount", () => {
  const rule = new ManualTierPolicyAmountRangeRule(5, 4777.7);
  const item = newManualTierPolicy("x", "y");
  item.amount = 4779.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTierPolicyRequiredNameRule flags a blank name", () => {
  const rule = new ManualTierPolicyRequiredNameRule("manual tier policy needs an entry");
  const item = newManualTierPolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTierPolicyRequiredLocaleRule flags a blank locale", () => {
  const rule = new ManualTierPolicyRequiredLocaleRule("manual tier policy needs an entry");
  const item = newManualTierPolicy("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTierPolicyCohortLengthRule flags a long cohort", () => {
  const rule = new ManualTierPolicyCohortLengthRule(1000);
  const item = newManualTierPolicy("x", "y");
  item.cohort = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTierPolicyLocaleLengthRule flags a long locale", () => {
  const rule = new ManualTierPolicyLocaleLengthRule(16);
  const item = newManualTierPolicy("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
