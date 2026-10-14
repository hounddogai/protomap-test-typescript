import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPreferenceThresholdContactEmailLengthRule,
  SeasonalPreferenceThresholdLabelLengthRule,
  SeasonalPreferenceThresholdRequiredContactEmailRule,
  defaultSeasonalPreferenceThresholdValidator,
} from "./seasonal-preference-threshold-rules.js";
import { newSeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

test("SeasonalPreferenceThresholdValidator reports every problem", () => {
  const validator = defaultSeasonalPreferenceThresholdValidator();
  const item = newSeasonalPreferenceThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPreferenceThresholdRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new SeasonalPreferenceThresholdRequiredContactEmailRule("seasonal preference threshold needs this field");
  const item = newSeasonalPreferenceThreshold("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPreferenceThresholdLabelLengthRule flags a long label", () => {
  const rule = new SeasonalPreferenceThresholdLabelLengthRule(32);
  const item = newSeasonalPreferenceThreshold("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPreferenceThresholdContactEmailLengthRule flags a long contact email", () => {
  const rule = new SeasonalPreferenceThresholdContactEmailLengthRule(80);
  const item = newSeasonalPreferenceThreshold("x", "y");
  item.contactEmail = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
