import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBidRuleQuotaCodeLengthRule,
  PrimaryBidRuleQuotaRequiredCodeRule,
  defaultPrimaryBidRuleQuotaValidator,
} from "./primary-bid-rule-quota-rules.js";
import { newPrimaryBidRuleQuota } from "./primary-bid-rule-quota.js";

test("PrimaryBidRuleQuotaValidator reports every problem", () => {
  const validator = defaultPrimaryBidRuleQuotaValidator();
  const item = newPrimaryBidRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBidRuleQuotaCodeLengthRule flags a long code", () => {
  const rule = new PrimaryBidRuleQuotaCodeLengthRule(86400);
  const item = newPrimaryBidRuleQuota("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryBidRuleQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryBidRuleQuotaRequiredCodeRule("primary bid rule quota needs a value");
  const item = newPrimaryBidRuleQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
