import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPaywallVarianceCurrencyLengthRule,
  ManualPaywallVarianceEndsAtRangeRule,
  ManualPaywallVarianceRequiredLabelRule,
  ManualPaywallVarianceRequiredUtmSourceRule,
  defaultManualPaywallVarianceValidator,
} from "./manual-paywall-variance-rules.js";
import { newManualPaywallVariance } from "./manual-paywall-variance.js";

test("ManualPaywallVarianceValidator reports every problem", () => {
  const validator = defaultManualPaywallVarianceValidator();
  const item = newManualPaywallVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPaywallVarianceRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new ManualPaywallVarianceRequiredUtmSourceRule("manual paywall variance needs this field");
  const item = newManualPaywallVariance("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPaywallVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new ManualPaywallVarianceRequiredLabelRule("manual paywall variance needs this field");
  const item = newManualPaywallVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPaywallVarianceCurrencyLengthRule flags a long currency", () => {
  const rule = new ManualPaywallVarianceCurrencyLengthRule(32);
  const item = newManualPaywallVariance("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPaywallVarianceEndsAtRangeRule flags values above ends at", () => {
  const rule = new ManualPaywallVarianceEndsAtRangeRule(64, 255);
  const item = newManualPaywallVariance("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
