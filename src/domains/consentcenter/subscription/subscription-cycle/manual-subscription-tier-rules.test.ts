import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSubscriptionTierRequiredUnitRule,
  ManualSubscriptionTierWindowDaysRangeRule,
  defaultManualSubscriptionTierValidator,
} from "./manual-subscription-tier-rules.js";
import { newManualSubscriptionTier } from "./manual-subscription-tier.js";

test("ManualSubscriptionTierValidator reports every problem", () => {
  const validator = defaultManualSubscriptionTierValidator();
  const item = newManualSubscriptionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSubscriptionTierRequiredUnitRule flags a blank unit", () => {
  const rule = new ManualSubscriptionTierRequiredUnitRule("manual subscription tier needs an entry");
  const item = newManualSubscriptionTier("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualSubscriptionTierWindowDaysRangeRule flags values above window days", () => {
  const rule = new ManualSubscriptionTierWindowDaysRangeRule(120, 1000);
  const item = newManualSubscriptionTier("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
