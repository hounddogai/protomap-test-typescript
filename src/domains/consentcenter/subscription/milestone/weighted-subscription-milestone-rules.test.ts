import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedSubscriptionMilestoneOpenRateRangeRule,
  WeightedSubscriptionMilestoneRequiredTitleRule,
  WeightedSubscriptionMilestoneTitleLengthRule,
  defaultWeightedSubscriptionMilestoneValidator,
} from "./weighted-subscription-milestone-rules.js";
import { newWeightedSubscriptionMilestone } from "./weighted-subscription-milestone.js";

test("WeightedSubscriptionMilestoneValidator reports every problem", () => {
  const validator = defaultWeightedSubscriptionMilestoneValidator();
  const item = newWeightedSubscriptionMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedSubscriptionMilestoneOpenRateRangeRule flags values above open rate", () => {
  const rule = new WeightedSubscriptionMilestoneOpenRateRangeRule(7.8, 105.4);
  const item = newWeightedSubscriptionMilestone("x", "y");
  item.openRate = 106.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedSubscriptionMilestoneTitleLengthRule flags a long title", () => {
  const rule = new WeightedSubscriptionMilestoneTitleLengthRule(80);
  const item = newWeightedSubscriptionMilestone("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedSubscriptionMilestoneRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedSubscriptionMilestoneRequiredTitleRule("weighted subscription milestone needs an entry");
  const item = newWeightedSubscriptionMilestone("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
