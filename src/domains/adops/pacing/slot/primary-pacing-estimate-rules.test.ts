import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPacingEstimateCeilingRangeRule,
  PrimaryPacingEstimateImpressionsRangeRule,
  PrimaryPacingEstimateTitleLengthRule,
  defaultPrimaryPacingEstimateValidator,
} from "./primary-pacing-estimate-rules.js";
import { newPrimaryPacingEstimate } from "./primary-pacing-estimate.js";

test("PrimaryPacingEstimateValidator reports every problem", () => {
  const validator = defaultPrimaryPacingEstimateValidator();
  const item = newPrimaryPacingEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPacingEstimateImpressionsRangeRule flags values above impressions", () => {
  const rule = new PrimaryPacingEstimateImpressionsRangeRule(80, 86400);
  const item = newPrimaryPacingEstimate("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPacingEstimateTitleLengthRule flags a long title", () => {
  const rule = new PrimaryPacingEstimateTitleLengthRule(86400);
  const item = newPrimaryPacingEstimate("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPacingEstimateCeilingRangeRule flags values above ceiling", () => {
  const rule = new PrimaryPacingEstimateCeilingRangeRule(1.9, 1580.9);
  const item = newPrimaryPacingEstimate("x", "y");
  item.ceiling = 1582.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
