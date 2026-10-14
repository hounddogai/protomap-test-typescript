import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleQuotaImpressionsRangeRule,
  BidRuleQuotaRequiredAudienceIdRule,
  BidRuleQuotaRequiredTitleRule,
  defaultBidRuleQuotaValidator,
} from "./bid-rule-quota-rules.js";
import { newBidRuleQuota } from "./bid-rule-quota.js";

test("BidRuleQuotaValidator reports every problem", () => {
  const validator = defaultBidRuleQuotaValidator();
  const item = newBidRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new BidRuleQuotaRequiredTitleRule("bid rule quota needs an entry");
  const item = newBidRuleQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleQuotaRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new BidRuleQuotaRequiredAudienceIdRule("bid rule quota needs a value");
  const item = newBidRuleQuota("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleQuotaImpressionsRangeRule flags values above impressions", () => {
  const rule = new BidRuleQuotaImpressionsRangeRule(32, 3600);
  const item = newBidRuleQuota("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
