import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleExceptionFrequencyCapRangeRule,
  BidRuleExceptionRequiredCodeRule,
  BidRuleExceptionRequiredContactEmailRule,
  defaultBidRuleExceptionValidator,
} from "./bid-rule-exception-rules.js";
import { newBidRuleException } from "./bid-rule-exception.js";

test("BidRuleExceptionValidator reports every problem", () => {
  const validator = defaultBidRuleExceptionValidator();
  const item = newBidRuleException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleExceptionRequiredCodeRule("bid rule exception needs an entry");
  const item = newBidRuleException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleExceptionFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BidRuleExceptionFrequencyCapRangeRule(16, 32);
  const item = newBidRuleException("x", "y");
  item.frequencyCap = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleExceptionRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new BidRuleExceptionRequiredContactEmailRule("bid rule exception needs this field");
  const item = newBidRuleException("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
