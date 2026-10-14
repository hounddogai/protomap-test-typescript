import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPaywallThresholdCostRangeRule,
  RegionalPaywallThresholdRequiredCodeRule,
  RegionalPaywallThresholdRequiredLocaleRule,
  defaultRegionalPaywallThresholdValidator,
} from "./regional-paywall-threshold-rules.js";
import { newRegionalPaywallThreshold } from "./regional-paywall-threshold.js";

test("RegionalPaywallThresholdValidator reports every problem", () => {
  const validator = defaultRegionalPaywallThresholdValidator();
  const item = newRegionalPaywallThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPaywallThresholdRequiredLocaleRule flags a blank locale", () => {
  const rule = new RegionalPaywallThresholdRequiredLocaleRule("regional paywall threshold needs this field");
  const item = newRegionalPaywallThreshold("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPaywallThresholdCostRangeRule flags values above cost", () => {
  const rule = new RegionalPaywallThresholdCostRangeRule(4.1, 459.1);
  const item = newRegionalPaywallThreshold("x", "y");
  item.cost = 460.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPaywallThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalPaywallThresholdRequiredCodeRule("regional paywall threshold needs this field");
  const item = newRegionalPaywallThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
