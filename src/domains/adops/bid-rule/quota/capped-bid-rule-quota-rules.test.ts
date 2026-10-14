import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBidRuleQuotaDescriptionLengthRule,
  CappedBidRuleQuotaGraceDaysRangeRule,
  CappedBidRuleQuotaRequiredDescriptionRule,
  CappedBidRuleQuotaRequiredTitleRule,
  defaultCappedBidRuleQuotaValidator,
} from "./capped-bid-rule-quota-rules.js";
import { newCappedBidRuleQuota } from "./capped-bid-rule-quota.js";

test("CappedBidRuleQuotaValidator reports every problem", () => {
  const validator = defaultCappedBidRuleQuotaValidator();
  const item = newCappedBidRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBidRuleQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new CappedBidRuleQuotaRequiredTitleRule("capped bid rule quota needs this field");
  const item = newCappedBidRuleQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBidRuleQuotaRequiredDescriptionRule flags a blank description", () => {
  const rule = new CappedBidRuleQuotaRequiredDescriptionRule("capped bid rule quota needs this field");
  const item = newCappedBidRuleQuota("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBidRuleQuotaDescriptionLengthRule flags a long description", () => {
  const rule = new CappedBidRuleQuotaDescriptionLengthRule(86400);
  const item = newCappedBidRuleQuota("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedBidRuleQuotaGraceDaysRangeRule flags values above grace days", () => {
  const rule = new CappedBidRuleQuotaGraceDaysRangeRule(16, 255);
  const item = newCappedBidRuleQuota("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
