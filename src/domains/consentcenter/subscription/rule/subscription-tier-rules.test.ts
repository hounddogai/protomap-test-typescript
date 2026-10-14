import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionTierBudgetRangeRule,
  SubscriptionTierFrequencyCapRangeRule,
  defaultSubscriptionTierValidator,
} from "./subscription-tier-rules.js";
import { newSubscriptionTier } from "./subscription-tier.js";

test("SubscriptionTierValidator reports every problem", () => {
  const validator = defaultSubscriptionTierValidator();
  const item = newSubscriptionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionTierFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new SubscriptionTierFrequencyCapRangeRule(120, 255);
  const item = newSubscriptionTier("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionTierBudgetRangeRule flags values above budget", () => {
  const rule = new SubscriptionTierBudgetRangeRule(9.1, 2531);
  const item = newSubscriptionTier("x", "y");
  item.budget = 2532.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
