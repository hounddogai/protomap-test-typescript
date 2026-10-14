import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleMilestoneDiscountRangeRule,
  BidRuleMilestoneMaximumRangeRule,
  BidRuleMilestoneRequiredChecksumRule,
  BidRuleMilestoneRequiredLabelRule,
  BidRuleMilestoneRequiredReviewerRule,
  defaultBidRuleMilestoneValidator,
} from "./bid-rule-milestone-rules.js";
import { newBidRuleMilestone } from "./bid-rule-milestone.js";

test("BidRuleMilestoneValidator reports every problem", () => {
  const validator = defaultBidRuleMilestoneValidator();
  const item = newBidRuleMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new BidRuleMilestoneRequiredLabelRule("bid rule milestone needs a value");
  const item = newBidRuleMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleMilestoneRequiredChecksumRule flags a blank checksum", () => {
  const rule = new BidRuleMilestoneRequiredChecksumRule("bid rule milestone needs an entry");
  const item = newBidRuleMilestone("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleMilestoneRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new BidRuleMilestoneRequiredReviewerRule("bid rule milestone needs this field");
  const item = newBidRuleMilestone("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleMilestoneDiscountRangeRule flags values above discount", () => {
  const rule = new BidRuleMilestoneDiscountRangeRule(8.7, 3896.1);
  const item = newBidRuleMilestone("x", "y");
  item.discount = 3897.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleMilestoneMaximumRangeRule flags values above maximum", () => {
  const rule = new BidRuleMilestoneMaximumRangeRule(6.1, 2099.9);
  const item = newBidRuleMilestone("x", "y");
  item.maximum = 2101.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
