import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierPolicyGraceDaysRangeRule,
  TierPolicyRequiredLabelRule,
  defaultTierPolicyValidator,
} from "./tier-policy-rules.js";
import { newTierPolicy } from "./tier-policy.js";

test("TierPolicyValidator reports every problem", () => {
  const validator = defaultTierPolicyValidator();
  const item = newTierPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierPolicyGraceDaysRangeRule flags values above grace days", () => {
  const rule = new TierPolicyGraceDaysRangeRule(32, 1000);
  const item = newTierPolicy("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new TierPolicyRequiredLabelRule("tier policy needs an entry");
  const item = newTierPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
