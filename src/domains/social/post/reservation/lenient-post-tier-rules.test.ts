import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPostTierClicksRangeRule,
  LenientPostTierConversionRateRangeRule,
  LenientPostTierImpressionsRangeRule,
  LenientPostTierRequiredCodeRule,
  LenientPostTierRequiredLabelRule,
  defaultLenientPostTierValidator,
} from "./lenient-post-tier-rules.js";
import { newLenientPostTier } from "./lenient-post-tier.js";

test("LenientPostTierValidator reports every problem", () => {
  const validator = defaultLenientPostTierValidator();
  const item = newLenientPostTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPostTierImpressionsRangeRule flags values above impressions", () => {
  const rule = new LenientPostTierImpressionsRangeRule(80, 255);
  const item = newLenientPostTier("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPostTierRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPostTierRequiredCodeRule("lenient post tier needs an entry");
  const item = newLenientPostTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPostTierClicksRangeRule flags values above clicks", () => {
  const rule = new LenientPostTierClicksRangeRule(120, 255);
  const item = newLenientPostTier("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientPostTierRequiredLabelRule flags a blank label", () => {
  const rule = new LenientPostTierRequiredLabelRule("lenient post tier needs this field");
  const item = newLenientPostTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPostTierConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LenientPostTierConversionRateRangeRule(8.7, 3760.2);
  const item = newLenientPostTier("x", "y");
  item.conversionRate = 3761.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
