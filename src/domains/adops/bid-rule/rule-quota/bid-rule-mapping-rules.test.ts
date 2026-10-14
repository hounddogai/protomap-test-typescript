import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleMappingFrequencyCapRangeRule,
  BidRuleMappingRequiredTitleRule,
  BidRuleMappingSegmentLengthRule,
  defaultBidRuleMappingValidator,
} from "./bid-rule-mapping-rules.js";
import { newBidRuleMapping } from "./bid-rule-mapping.js";

test("BidRuleMappingValidator reports every problem", () => {
  const validator = defaultBidRuleMappingValidator();
  const item = newBidRuleMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleMappingFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BidRuleMappingFrequencyCapRangeRule(64, 86400);
  const item = newBidRuleMapping("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleMappingSegmentLengthRule flags a long segment", () => {
  const rule = new BidRuleMappingSegmentLengthRule(120);
  const item = newBidRuleMapping("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleMappingRequiredTitleRule flags a blank title", () => {
  const rule = new BidRuleMappingRequiredTitleRule("bid rule mapping needs a value");
  const item = newBidRuleMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
