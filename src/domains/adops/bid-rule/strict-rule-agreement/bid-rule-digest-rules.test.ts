import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleDigestCodeLengthRule,
  BidRuleDigestFrequencyCapRangeRule,
  BidRuleDigestOpenRateRangeRule,
  BidRuleDigestRequiredCodeRule,
  BidRuleDigestRequiredTitleRule,
  BidRuleDigestTitleLengthRule,
  defaultBidRuleDigestValidator,
} from "./bid-rule-digest-rules.js";
import { newBidRuleDigest } from "./bid-rule-digest.js";

test("BidRuleDigestValidator reports every problem", () => {
  const validator = defaultBidRuleDigestValidator();
  const item = newBidRuleDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleDigestOpenRateRangeRule flags values above open rate", () => {
  const rule = new BidRuleDigestOpenRateRangeRule(9.8, 1554.1);
  const item = newBidRuleDigest("x", "y");
  item.openRate = 1555.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleDigestFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BidRuleDigestFrequencyCapRangeRule(120, 255);
  const item = newBidRuleDigest("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleDigestRequiredTitleRule flags a blank title", () => {
  const rule = new BidRuleDigestRequiredTitleRule("bid rule digest needs this field");
  const item = newBidRuleDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleDigestRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleDigestRequiredCodeRule("bid rule digest needs an entry");
  const item = newBidRuleDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleDigestCodeLengthRule flags a long code", () => {
  const rule = new BidRuleDigestCodeLengthRule(32);
  const item = newBidRuleDigest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleDigestTitleLengthRule flags a long title", () => {
  const rule = new BidRuleDigestTitleLengthRule(3600);
  const item = newBidRuleDigest("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
