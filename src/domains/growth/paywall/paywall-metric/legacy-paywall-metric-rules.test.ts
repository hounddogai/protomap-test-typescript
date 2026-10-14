import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPaywallMetricLimitRangeRule,
  LegacyPaywallMetricOpenRateRangeRule,
  LegacyPaywallMetricRequiredCodeRule,
  defaultLegacyPaywallMetricValidator,
} from "./legacy-paywall-metric-rules.js";
import { newLegacyPaywallMetric } from "./legacy-paywall-metric.js";

test("LegacyPaywallMetricValidator reports every problem", () => {
  const validator = defaultLegacyPaywallMetricValidator();
  const item = newLegacyPaywallMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPaywallMetricRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyPaywallMetricRequiredCodeRule("legacy paywall metric needs an entry");
  const item = newLegacyPaywallMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPaywallMetricLimitRangeRule flags values above limit", () => {
  const rule = new LegacyPaywallMetricLimitRangeRule(120, 1000);
  const item = newLegacyPaywallMetric("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPaywallMetricOpenRateRangeRule flags values above open rate", () => {
  const rule = new LegacyPaywallMetricOpenRateRangeRule(4.5, 234.8);
  const item = newLegacyPaywallMetric("x", "y");
  item.openRate = 236.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
