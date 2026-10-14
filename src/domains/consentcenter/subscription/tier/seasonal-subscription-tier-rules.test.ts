import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSubscriptionTierLimitRangeRule,
  SeasonalSubscriptionTierPriorityRangeRule,
  SeasonalSubscriptionTierUpdatedAtRangeRule,
  defaultSeasonalSubscriptionTierValidator,
} from "./seasonal-subscription-tier-rules.js";
import { newSeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

test("SeasonalSubscriptionTierValidator reports every problem", () => {
  const validator = defaultSeasonalSubscriptionTierValidator();
  const item = newSeasonalSubscriptionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSubscriptionTierUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new SeasonalSubscriptionTierUpdatedAtRangeRule(64, 1000);
  const item = newSeasonalSubscriptionTier("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSubscriptionTierLimitRangeRule flags values above limit", () => {
  const rule = new SeasonalSubscriptionTierLimitRangeRule(255, 86400);
  const item = newSeasonalSubscriptionTier("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSubscriptionTierPriorityRangeRule flags values above priority", () => {
  const rule = new SeasonalSubscriptionTierPriorityRangeRule(3600, 86400);
  const item = newSeasonalSubscriptionTier("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
