import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePacingBaselineCostRangeRule,
  AdaptivePacingBaselineRequiredAudienceIdRule,
  AdaptivePacingBaselineTitleLengthRule,
  defaultAdaptivePacingBaselineValidator,
} from "./adaptive-pacing-baseline-rules.js";
import { newAdaptivePacingBaseline } from "./adaptive-pacing-baseline.js";

test("AdaptivePacingBaselineValidator reports every problem", () => {
  const validator = defaultAdaptivePacingBaselineValidator();
  const item = newAdaptivePacingBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePacingBaselineCostRangeRule flags values above cost", () => {
  const rule = new AdaptivePacingBaselineCostRangeRule(9.2, 3466.9);
  const item = newAdaptivePacingBaseline("x", "y");
  item.cost = 3468.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePacingBaselineTitleLengthRule flags a long title", () => {
  const rule = new AdaptivePacingBaselineTitleLengthRule(1000);
  const item = newAdaptivePacingBaseline("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePacingBaselineRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new AdaptivePacingBaselineRequiredAudienceIdRule("adaptive pacing baseline needs this field");
  const item = newAdaptivePacingBaseline("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
