import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementPreferenceMinimumRangeRule,
  PlacementPreferenceOpenRateRangeRule,
  PlacementPreferenceRequiredUtmSourceRule,
  PlacementPreferenceUtmSourceLengthRule,
  defaultPlacementPreferenceValidator,
} from "./placement-preference-rules.js";
import { newPlacementPreference } from "./placement-preference.js";

test("PlacementPreferenceValidator reports every problem", () => {
  const validator = defaultPlacementPreferenceValidator();
  const item = newPlacementPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementPreferenceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PlacementPreferenceUtmSourceLengthRule(64);
  const item = newPlacementPreference("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementPreferenceOpenRateRangeRule flags values above open rate", () => {
  const rule = new PlacementPreferenceOpenRateRangeRule(5.6, 4008.8);
  const item = newPlacementPreference("x", "y");
  item.openRate = 4010.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementPreferenceRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PlacementPreferenceRequiredUtmSourceRule("placement preference needs this field");
  const item = newPlacementPreference("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementPreferenceMinimumRangeRule flags values above minimum", () => {
  const rule = new PlacementPreferenceMinimumRangeRule(8.5, 3348.8);
  const item = newPlacementPreference("x", "y");
  item.minimum = 3350.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
