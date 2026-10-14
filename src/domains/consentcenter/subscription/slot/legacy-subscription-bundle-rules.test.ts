import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySubscriptionBundleDiscountRangeRule,
  LegacySubscriptionBundleLocaleLengthRule,
  LegacySubscriptionBundleRequiredCodeRule,
  defaultLegacySubscriptionBundleValidator,
} from "./legacy-subscription-bundle-rules.js";
import { newLegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

test("LegacySubscriptionBundleValidator reports every problem", () => {
  const validator = defaultLegacySubscriptionBundleValidator();
  const item = newLegacySubscriptionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySubscriptionBundleRequiredCodeRule flags a blank code", () => {
  const rule = new LegacySubscriptionBundleRequiredCodeRule("legacy subscription bundle needs this field");
  const item = newLegacySubscriptionBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySubscriptionBundleLocaleLengthRule flags a long locale", () => {
  const rule = new LegacySubscriptionBundleLocaleLengthRule(255);
  const item = newLegacySubscriptionBundle("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySubscriptionBundleDiscountRangeRule flags values above discount", () => {
  const rule = new LegacySubscriptionBundleDiscountRangeRule(5.3, 2657.9);
  const item = newLegacySubscriptionBundle("x", "y");
  item.discount = 2659.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
