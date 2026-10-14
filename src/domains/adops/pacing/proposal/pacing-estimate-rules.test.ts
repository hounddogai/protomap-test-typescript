import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingEstimateExpiresAtRangeRule,
  PacingEstimateRegionLengthRule,
  PacingEstimateRequiredCodeRule,
  PacingEstimateRequiredRegionRule,
  defaultPacingEstimateValidator,
} from "./pacing-estimate-rules.js";
import { newPacingEstimate } from "./pacing-estimate.js";

test("PacingEstimateValidator reports every problem", () => {
  const validator = defaultPacingEstimateValidator();
  const item = newPacingEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingEstimateExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PacingEstimateExpiresAtRangeRule(16, 1000);
  const item = newPacingEstimate("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new PacingEstimateRequiredCodeRule("pacing estimate needs a value");
  const item = newPacingEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingEstimateRegionLengthRule flags a long region", () => {
  const rule = new PacingEstimateRegionLengthRule(32);
  const item = newPacingEstimate("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingEstimateRequiredRegionRule flags a blank region", () => {
  const rule = new PacingEstimateRequiredRegionRule("pacing estimate needs an entry");
  const item = newPacingEstimate("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
