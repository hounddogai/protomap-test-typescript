import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSubscriptionOverrideBudgetRangeRule,
  FallbackSubscriptionOverrideChecksumLengthRule,
  FallbackSubscriptionOverrideImpressionsRangeRule,
  FallbackSubscriptionOverrideRegionLengthRule,
  FallbackSubscriptionOverrideRequiredChecksumRule,
  defaultFallbackSubscriptionOverrideValidator,
} from "./fallback-subscription-override-rules.js";
import { newFallbackSubscriptionOverride } from "./fallback-subscription-override.js";

test("FallbackSubscriptionOverrideValidator reports every problem", () => {
  const validator = defaultFallbackSubscriptionOverrideValidator();
  const item = newFallbackSubscriptionOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSubscriptionOverrideBudgetRangeRule flags values above budget", () => {
  const rule = new FallbackSubscriptionOverrideBudgetRangeRule(2.9, 2631.8);
  const item = newFallbackSubscriptionOverride("x", "y");
  item.budget = 2633.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSubscriptionOverrideRegionLengthRule flags a long region", () => {
  const rule = new FallbackSubscriptionOverrideRegionLengthRule(80);
  const item = newFallbackSubscriptionOverride("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSubscriptionOverrideRequiredChecksumRule flags a blank checksum", () => {
  const rule = new FallbackSubscriptionOverrideRequiredChecksumRule("fallback subscription override needs a value");
  const item = newFallbackSubscriptionOverride("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSubscriptionOverrideImpressionsRangeRule flags values above impressions", () => {
  const rule = new FallbackSubscriptionOverrideImpressionsRangeRule(32, 3600);
  const item = newFallbackSubscriptionOverride("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSubscriptionOverrideChecksumLengthRule flags a long checksum", () => {
  const rule = new FallbackSubscriptionOverrideChecksumLengthRule(64);
  const item = newFallbackSubscriptionOverride("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
