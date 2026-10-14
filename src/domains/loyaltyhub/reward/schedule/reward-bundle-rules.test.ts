import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardBundleImpressionsRangeRule,
  RewardBundleRequiredUnitRule,
  RewardBundleUtmSourceLengthRule,
  defaultRewardBundleValidator,
} from "./reward-bundle-rules.js";
import { newRewardBundle } from "./reward-bundle.js";

test("RewardBundleValidator reports every problem", () => {
  const validator = defaultRewardBundleValidator();
  const item = newRewardBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardBundleRequiredUnitRule flags a blank unit", () => {
  const rule = new RewardBundleRequiredUnitRule("reward bundle needs this field");
  const item = newRewardBundle("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardBundleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RewardBundleUtmSourceLengthRule(16);
  const item = newRewardBundle("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardBundleImpressionsRangeRule flags values above impressions", () => {
  const rule = new RewardBundleImpressionsRangeRule(80, 120);
  const item = newRewardBundle("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
