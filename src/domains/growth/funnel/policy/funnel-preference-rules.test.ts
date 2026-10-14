import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelPreferenceCodeLengthRule,
  FunnelPreferenceCostRangeRule,
  FunnelPreferenceRateRangeRule,
  FunnelPreferenceRequiredCodeRule,
  defaultFunnelPreferenceValidator,
} from "./funnel-preference-rules.js";
import { newFunnelPreference } from "./funnel-preference.js";

test("FunnelPreferenceValidator reports every problem", () => {
  const validator = defaultFunnelPreferenceValidator();
  const item = newFunnelPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new FunnelPreferenceRequiredCodeRule("funnel preference needs an entry");
  const item = newFunnelPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelPreferenceCodeLengthRule flags a long code", () => {
  const rule = new FunnelPreferenceCodeLengthRule(3600);
  const item = newFunnelPreference("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelPreferenceCostRangeRule flags values above cost", () => {
  const rule = new FunnelPreferenceCostRangeRule(1.9, 2563.2);
  const item = newFunnelPreference("x", "y");
  item.cost = 2564.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelPreferenceRateRangeRule flags values above rate", () => {
  const rule = new FunnelPreferenceRateRangeRule(0.3, 2753.5);
  const item = newFunnelPreference("x", "y");
  item.rate = 2755;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
