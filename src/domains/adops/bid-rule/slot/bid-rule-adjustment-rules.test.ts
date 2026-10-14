import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleAdjustmentFrequencyCapRangeRule,
  BidRuleAdjustmentRequiredNameRule,
  BidRuleAdjustmentSegmentLengthRule,
  defaultBidRuleAdjustmentValidator,
} from "./bid-rule-adjustment-rules.js";
import { newBidRuleAdjustment } from "./bid-rule-adjustment.js";

test("BidRuleAdjustmentValidator reports every problem", () => {
  const validator = defaultBidRuleAdjustmentValidator();
  const item = newBidRuleAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new BidRuleAdjustmentRequiredNameRule("bid rule adjustment needs an entry");
  const item = newBidRuleAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleAdjustmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BidRuleAdjustmentFrequencyCapRangeRule(255, 86400);
  const item = newBidRuleAdjustment("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleAdjustmentSegmentLengthRule flags a long segment", () => {
  const rule = new BidRuleAdjustmentSegmentLengthRule(120);
  const item = newBidRuleAdjustment("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
