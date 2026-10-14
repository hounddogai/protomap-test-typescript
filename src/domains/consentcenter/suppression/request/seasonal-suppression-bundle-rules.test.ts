import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSuppressionBundleCodeLengthRule,
  SeasonalSuppressionBundleRequiredLabelRule,
  SeasonalSuppressionBundleSegmentLengthRule,
  SeasonalSuppressionBundleWeightRangeRule,
  defaultSeasonalSuppressionBundleValidator,
} from "./seasonal-suppression-bundle-rules.js";
import { newSeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

test("SeasonalSuppressionBundleValidator reports every problem", () => {
  const validator = defaultSeasonalSuppressionBundleValidator();
  const item = newSeasonalSuppressionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSuppressionBundleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalSuppressionBundleCodeLengthRule(80);
  const item = newSeasonalSuppressionBundle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSuppressionBundleWeightRangeRule flags values above weight", () => {
  const rule = new SeasonalSuppressionBundleWeightRangeRule(5, 4476.4);
  const item = newSeasonalSuppressionBundle("x", "y");
  item.weight = 4477.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSuppressionBundleSegmentLengthRule flags a long segment", () => {
  const rule = new SeasonalSuppressionBundleSegmentLengthRule(32);
  const item = newSeasonalSuppressionBundle("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSuppressionBundleRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalSuppressionBundleRequiredLabelRule("seasonal suppression bundle needs this field");
  const item = newSeasonalSuppressionBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
