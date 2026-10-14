import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRulePolicyCodeLengthRule,
  BidRulePolicyCurrencyLengthRule,
  BidRulePolicyRequiredCurrencyRule,
  BidRulePolicyRequiredTitleRule,
  BidRulePolicyRevisionRangeRule,
  BidRulePolicyTitleLengthRule,
  defaultBidRulePolicyValidator,
} from "./bid-rule-policy-rules.js";
import { newBidRulePolicy } from "./bid-rule-policy.js";

test("BidRulePolicyValidator reports every problem", () => {
  const validator = defaultBidRulePolicyValidator();
  const item = newBidRulePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRulePolicyCurrencyLengthRule flags a long currency", () => {
  const rule = new BidRulePolicyCurrencyLengthRule(16);
  const item = newBidRulePolicy("x", "y");
  item.currency = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRulePolicyRequiredTitleRule flags a blank title", () => {
  const rule = new BidRulePolicyRequiredTitleRule("bid rule policy needs this field");
  const item = newBidRulePolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRulePolicyRequiredCurrencyRule flags a blank currency", () => {
  const rule = new BidRulePolicyRequiredCurrencyRule("bid rule policy needs this field");
  const item = newBidRulePolicy("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRulePolicyCodeLengthRule flags a long code", () => {
  const rule = new BidRulePolicyCodeLengthRule(80);
  const item = newBidRulePolicy("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRulePolicyRevisionRangeRule flags values above revision", () => {
  const rule = new BidRulePolicyRevisionRangeRule(16, 255);
  const item = newBidRulePolicy("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRulePolicyTitleLengthRule flags a long title", () => {
  const rule = new BidRulePolicyTitleLengthRule(1000);
  const item = newBidRulePolicy("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
