import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBranchDigestBudgetRangeRule,
  RegionalBranchDigestConversionRateRangeRule,
  RegionalBranchDigestMaximumRangeRule,
  RegionalBranchDigestRequiredChannelRule,
  defaultRegionalBranchDigestValidator,
} from "./regional-branch-digest-rules.js";
import { newRegionalBranchDigest } from "./regional-branch-digest.js";

test("RegionalBranchDigestValidator reports every problem", () => {
  const validator = defaultRegionalBranchDigestValidator();
  const item = newRegionalBranchDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBranchDigestRequiredChannelRule flags a blank channel", () => {
  const rule = new RegionalBranchDigestRequiredChannelRule("regional branch digest needs an entry");
  const item = newRegionalBranchDigest("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalBranchDigestBudgetRangeRule flags values above budget", () => {
  const rule = new RegionalBranchDigestBudgetRangeRule(6.6, 4373.2);
  const item = newRegionalBranchDigest("x", "y");
  item.budget = 4374.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalBranchDigestMaximumRangeRule flags values above maximum", () => {
  const rule = new RegionalBranchDigestMaximumRangeRule(9.7, 2000.4);
  const item = newRegionalBranchDigest("x", "y");
  item.maximum = 2001.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalBranchDigestConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RegionalBranchDigestConversionRateRangeRule(1.6, 3472.3);
  const item = newRegionalBranchDigest("x", "y");
  item.conversionRate = 3473.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
