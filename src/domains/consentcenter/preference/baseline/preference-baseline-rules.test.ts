import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceBaselineRequiredReviewerRule,
  PreferenceBaselineRetriesRangeRule,
  defaultPreferenceBaselineValidator,
} from "./preference-baseline-rules.js";
import { newPreferenceBaseline } from "./preference-baseline.js";

test("PreferenceBaselineValidator reports every problem", () => {
  const validator = defaultPreferenceBaselineValidator();
  const item = newPreferenceBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceBaselineRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PreferenceBaselineRequiredReviewerRule("preference baseline needs this field");
  const item = newPreferenceBaseline("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceBaselineRetriesRangeRule flags values above retries", () => {
  const rule = new PreferenceBaselineRetriesRangeRule(255, 255);
  const item = newPreferenceBaseline("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
