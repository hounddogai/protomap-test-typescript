import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedRewardRuleQuotaAttemptsRangeRule,
  BatchedRewardRuleQuotaCodeLengthRule,
  BatchedRewardRuleQuotaRequiredCountryRule,
  BatchedRewardRuleQuotaUtmSourceLengthRule,
  defaultBatchedRewardRuleQuotaValidator,
} from "./batched-reward-rule-quota-rules.js";
import { newBatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

test("BatchedRewardRuleQuotaValidator reports every problem", () => {
  const validator = defaultBatchedRewardRuleQuotaValidator();
  const item = newBatchedRewardRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedRewardRuleQuotaUtmSourceLengthRule flags a long utm source", () => {
  const rule = new BatchedRewardRuleQuotaUtmSourceLengthRule(120);
  const item = newBatchedRewardRuleQuota("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRewardRuleQuotaCodeLengthRule flags a long code", () => {
  const rule = new BatchedRewardRuleQuotaCodeLengthRule(3600);
  const item = newBatchedRewardRuleQuota("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRewardRuleQuotaAttemptsRangeRule flags values above attempts", () => {
  const rule = new BatchedRewardRuleQuotaAttemptsRangeRule(16, 80);
  const item = newBatchedRewardRuleQuota("x", "y");
  item.attempts = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedRewardRuleQuotaRequiredCountryRule flags a blank country", () => {
  const rule = new BatchedRewardRuleQuotaRequiredCountryRule("batched reward rule quota needs a value");
  const item = newBatchedRewardRuleQuota("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
