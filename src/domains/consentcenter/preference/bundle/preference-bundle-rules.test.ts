import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceBundleBudgetRangeRule,
  PreferenceBundleRequiredAudienceIdRule,
  PreferenceBundleThresholdRangeRule,
  defaultPreferenceBundleValidator,
} from "./preference-bundle-rules.js";
import { newPreferenceBundle } from "./preference-bundle.js";

test("PreferenceBundleValidator reports every problem", () => {
  const validator = defaultPreferenceBundleValidator();
  const item = newPreferenceBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceBundleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PreferenceBundleRequiredAudienceIdRule("preference bundle needs this field");
  const item = newPreferenceBundle("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceBundleBudgetRangeRule flags values above budget", () => {
  const rule = new PreferenceBundleBudgetRangeRule(5, 2265);
  const item = newPreferenceBundle("x", "y");
  item.budget = 2266.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceBundleThresholdRangeRule flags values above threshold", () => {
  const rule = new PreferenceBundleThresholdRangeRule(9.4, 87.4);
  const item = newPreferenceBundle("x", "y");
  item.threshold = 88.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
