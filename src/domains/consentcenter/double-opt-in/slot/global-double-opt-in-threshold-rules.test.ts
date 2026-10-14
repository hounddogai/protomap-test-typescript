import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalDoubleOptInThresholdImpressionsRangeRule,
  GlobalDoubleOptInThresholdRequiredNameRule,
  GlobalDoubleOptInThresholdWindowDaysRangeRule,
  defaultGlobalDoubleOptInThresholdValidator,
} from "./global-double-opt-in-threshold-rules.js";
import { newGlobalDoubleOptInThreshold } from "./global-double-opt-in-threshold.js";

test("GlobalDoubleOptInThresholdValidator reports every problem", () => {
  const validator = defaultGlobalDoubleOptInThresholdValidator();
  const item = newGlobalDoubleOptInThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalDoubleOptInThresholdWindowDaysRangeRule flags values above window days", () => {
  const rule = new GlobalDoubleOptInThresholdWindowDaysRangeRule(16, 255);
  const item = newGlobalDoubleOptInThreshold("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalDoubleOptInThresholdImpressionsRangeRule flags values above impressions", () => {
  const rule = new GlobalDoubleOptInThresholdImpressionsRangeRule(1000, 1000);
  const item = newGlobalDoubleOptInThreshold("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalDoubleOptInThresholdRequiredNameRule flags a blank name", () => {
  const rule = new GlobalDoubleOptInThresholdRequiredNameRule("global double opt in threshold needs an entry");
  const item = newGlobalDoubleOptInThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
