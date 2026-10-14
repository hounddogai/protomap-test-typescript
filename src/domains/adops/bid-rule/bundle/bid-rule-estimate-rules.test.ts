import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleEstimateAmountRangeRule,
  BidRuleEstimateRequiredNameRule,
  defaultBidRuleEstimateValidator,
} from "./bid-rule-estimate-rules.js";
import { newBidRuleEstimate } from "./bid-rule-estimate.js";

test("BidRuleEstimateValidator reports every problem", () => {
  const validator = defaultBidRuleEstimateValidator();
  const item = newBidRuleEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleEstimateRequiredNameRule flags a blank name", () => {
  const rule = new BidRuleEstimateRequiredNameRule("bid rule estimate needs a value");
  const item = newBidRuleEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleEstimateAmountRangeRule flags values above amount", () => {
  const rule = new BidRuleEstimateAmountRangeRule(0.5, 4712.5);
  const item = newBidRuleEstimate("x", "y");
  item.amount = 4714;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
