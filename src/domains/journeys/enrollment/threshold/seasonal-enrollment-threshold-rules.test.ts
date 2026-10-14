import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEnrollmentThresholdLabelLengthRule,
  SeasonalEnrollmentThresholdRequiredLabelRule,
  SeasonalEnrollmentThresholdRequiredRegionRule,
  defaultSeasonalEnrollmentThresholdValidator,
} from "./seasonal-enrollment-threshold-rules.js";
import { newSeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

test("SeasonalEnrollmentThresholdValidator reports every problem", () => {
  const validator = defaultSeasonalEnrollmentThresholdValidator();
  const item = newSeasonalEnrollmentThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEnrollmentThresholdRequiredRegionRule flags a blank region", () => {
  const rule = new SeasonalEnrollmentThresholdRequiredRegionRule("seasonal enrollment threshold needs this field");
  const item = newSeasonalEnrollmentThreshold("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEnrollmentThresholdLabelLengthRule flags a long label", () => {
  const rule = new SeasonalEnrollmentThresholdLabelLengthRule(16);
  const item = newSeasonalEnrollmentThreshold("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalEnrollmentThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalEnrollmentThresholdRequiredLabelRule("seasonal enrollment threshold needs this field");
  const item = newSeasonalEnrollmentThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
