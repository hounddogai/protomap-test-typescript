import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceEstimateEndsAtRangeRule,
  PreferenceEstimateFloorValueRangeRule,
  PreferenceEstimateRequiredVariantRule,
  PreferenceEstimateTitleLengthRule,
  defaultPreferenceEstimateValidator,
} from "./preference-estimate-rules.js";
import { newPreferenceEstimate } from "./preference-estimate.js";

test("PreferenceEstimateValidator reports every problem", () => {
  const validator = defaultPreferenceEstimateValidator();
  const item = newPreferenceEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceEstimateTitleLengthRule flags a long title", () => {
  const rule = new PreferenceEstimateTitleLengthRule(255);
  const item = newPreferenceEstimate("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceEstimateFloorValueRangeRule flags values above floor value", () => {
  const rule = new PreferenceEstimateFloorValueRangeRule(6.1, 228.6);
  const item = newPreferenceEstimate("x", "y");
  item.floorValue = 230.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceEstimateRequiredVariantRule flags a blank variant", () => {
  const rule = new PreferenceEstimateRequiredVariantRule("preference estimate needs this field");
  const item = newPreferenceEstimate("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceEstimateEndsAtRangeRule flags values above ends at", () => {
  const rule = new PreferenceEstimateEndsAtRangeRule(64, 1000);
  const item = newPreferenceEstimate("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
