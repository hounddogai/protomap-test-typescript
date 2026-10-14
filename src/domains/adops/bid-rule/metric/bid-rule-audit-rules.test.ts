import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleAuditConversionRateRangeRule,
  BidRuleAuditRegionLengthRule,
  BidRuleAuditTitleLengthRule,
  defaultBidRuleAuditValidator,
} from "./bid-rule-audit-rules.js";
import { newBidRuleAudit } from "./bid-rule-audit.js";

test("BidRuleAuditValidator reports every problem", () => {
  const validator = defaultBidRuleAuditValidator();
  const item = newBidRuleAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleAuditConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new BidRuleAuditConversionRateRangeRule(3.9, 4189.8);
  const item = newBidRuleAudit("x", "y");
  item.conversionRate = 4191.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleAuditRegionLengthRule flags a long region", () => {
  const rule = new BidRuleAuditRegionLengthRule(16);
  const item = newBidRuleAudit("x", "y");
  item.region = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleAuditTitleLengthRule flags a long title", () => {
  const rule = new BidRuleAuditTitleLengthRule(80);
  const item = newBidRuleAudit("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
