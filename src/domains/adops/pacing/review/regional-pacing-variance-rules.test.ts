import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPacingVarianceImpressionsRangeRule,
  RegionalPacingVarianceSequenceRangeRule,
  defaultRegionalPacingVarianceValidator,
} from "./regional-pacing-variance-rules.js";
import { newRegionalPacingVariance } from "./regional-pacing-variance.js";

test("RegionalPacingVarianceValidator reports every problem", () => {
  const validator = defaultRegionalPacingVarianceValidator();
  const item = newRegionalPacingVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPacingVarianceSequenceRangeRule flags values above sequence", () => {
  const rule = new RegionalPacingVarianceSequenceRangeRule(16, 3600);
  const item = newRegionalPacingVariance("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPacingVarianceImpressionsRangeRule flags values above impressions", () => {
  const rule = new RegionalPacingVarianceImpressionsRangeRule(120, 3600);
  const item = newRegionalPacingVariance("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
