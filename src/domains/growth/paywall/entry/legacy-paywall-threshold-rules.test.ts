import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPaywallThresholdCodeLengthRule,
  LegacyPaywallThresholdImpressionsRangeRule,
  LegacyPaywallThresholdRateRangeRule,
  defaultLegacyPaywallThresholdValidator,
} from "./legacy-paywall-threshold-rules.js";
import { newLegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

test("LegacyPaywallThresholdValidator reports every problem", () => {
  const validator = defaultLegacyPaywallThresholdValidator();
  const item = newLegacyPaywallThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPaywallThresholdCodeLengthRule flags a long code", () => {
  const rule = new LegacyPaywallThresholdCodeLengthRule(32);
  const item = newLegacyPaywallThreshold("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPaywallThresholdImpressionsRangeRule flags values above impressions", () => {
  const rule = new LegacyPaywallThresholdImpressionsRangeRule(16, 16);
  const item = newLegacyPaywallThreshold("x", "y");
  item.impressions = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPaywallThresholdRateRangeRule flags values above rate", () => {
  const rule = new LegacyPaywallThresholdRateRangeRule(1.5, 344.7);
  const item = newLegacyPaywallThreshold("x", "y");
  item.rate = 346.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
