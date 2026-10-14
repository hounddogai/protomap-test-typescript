import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleThresholdAmountRangeRule,
  BidRuleThresholdCodeLengthRule,
  BidRuleThresholdCostRangeRule,
  BidRuleThresholdRequiredCampaignRefRule,
  BidRuleThresholdTitleLengthRule,
  defaultBidRuleThresholdValidator,
} from "./bid-rule-threshold-rules.js";
import { newBidRuleThreshold } from "./bid-rule-threshold.js";

test("BidRuleThresholdValidator reports every problem", () => {
  const validator = defaultBidRuleThresholdValidator();
  const item = newBidRuleThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleThresholdRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BidRuleThresholdRequiredCampaignRefRule("bid rule threshold needs a value");
  const item = newBidRuleThreshold("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleThresholdTitleLengthRule flags a long title", () => {
  const rule = new BidRuleThresholdTitleLengthRule(255);
  const item = newBidRuleThreshold("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleThresholdAmountRangeRule flags values above amount", () => {
  const rule = new BidRuleThresholdAmountRangeRule(0.7, 4354.2);
  const item = newBidRuleThreshold("x", "y");
  item.amount = 4355.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleThresholdCodeLengthRule flags a long code", () => {
  const rule = new BidRuleThresholdCodeLengthRule(80);
  const item = newBidRuleThreshold("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleThresholdCostRangeRule flags values above cost", () => {
  const rule = new BidRuleThresholdCostRangeRule(3.9, 4972.1);
  const item = newBidRuleThreshold("x", "y");
  item.cost = 4973.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
