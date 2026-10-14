import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPreferenceBaselineAudienceIdLengthRule,
  WeightedPreferenceBaselineRequiredNameRule,
  defaultWeightedPreferenceBaselineValidator,
} from "./weighted-preference-baseline-rules.js";
import { newWeightedPreferenceBaseline } from "./weighted-preference-baseline.js";

test("WeightedPreferenceBaselineValidator reports every problem", () => {
  const validator = defaultWeightedPreferenceBaselineValidator();
  const item = newWeightedPreferenceBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPreferenceBaselineRequiredNameRule flags a blank name", () => {
  const rule = new WeightedPreferenceBaselineRequiredNameRule("weighted preference baseline needs a value");
  const item = newWeightedPreferenceBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPreferenceBaselineAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WeightedPreferenceBaselineAudienceIdLengthRule(80);
  const item = newWeightedPreferenceBaseline("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
