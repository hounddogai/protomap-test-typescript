import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRewardRuleQuotaImpressionsRangeRule,
  StrictRewardRuleQuotaPhoneLengthRule,
  StrictRewardRuleQuotaRequiredCodeRule,
  StrictRewardRuleQuotaRequiredNameRule,
  StrictRewardRuleQuotaRevisionRangeRule,
  defaultStrictRewardRuleQuotaValidator,
} from "./strict-reward-rule-quota-rules.js";
import { newStrictRewardRuleQuota } from "./strict-reward-rule-quota.js";

test("StrictRewardRuleQuotaValidator reports every problem", () => {
  const validator = defaultStrictRewardRuleQuotaValidator();
  const item = newStrictRewardRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRewardRuleQuotaRevisionRangeRule flags values above revision", () => {
  const rule = new StrictRewardRuleQuotaRevisionRangeRule(80, 1000);
  const item = newStrictRewardRuleQuota("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRewardRuleQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new StrictRewardRuleQuotaRequiredCodeRule("strict reward rule quota needs this field");
  const item = newStrictRewardRuleQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRewardRuleQuotaImpressionsRangeRule flags values above impressions", () => {
  const rule = new StrictRewardRuleQuotaImpressionsRangeRule(3600, 86400);
  const item = newStrictRewardRuleQuota("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRewardRuleQuotaRequiredNameRule flags a blank name", () => {
  const rule = new StrictRewardRuleQuotaRequiredNameRule("strict reward rule quota needs a value");
  const item = newStrictRewardRuleQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRewardRuleQuotaPhoneLengthRule flags a long phone", () => {
  const rule = new StrictRewardRuleQuotaPhoneLengthRule(32);
  const item = newStrictRewardRuleQuota("x", "y");
  item.phone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
