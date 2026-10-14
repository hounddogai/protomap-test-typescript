import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortEstimateCodeLengthRule,
  CohortEstimateDurationMinutesRangeRule,
  CohortEstimateNameLengthRule,
  CohortEstimateRequiredCodeRule,
  defaultCohortEstimateValidator,
} from "./cohort-estimate-rules.js";
import { newCohortEstimate } from "./cohort-estimate.js";

test("CohortEstimateValidator reports every problem", () => {
  const validator = defaultCohortEstimateValidator();
  const item = newCohortEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortEstimateNameLengthRule flags a long name", () => {
  const rule = new CohortEstimateNameLengthRule(80);
  const item = newCohortEstimate("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortEstimateCodeLengthRule flags a long code", () => {
  const rule = new CohortEstimateCodeLengthRule(32);
  const item = newCohortEstimate("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortEstimateDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CohortEstimateDurationMinutesRangeRule(16, 120);
  const item = newCohortEstimate("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new CohortEstimateRequiredCodeRule("cohort estimate needs a value");
  const item = newCohortEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
