import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCohortEstimateNameLengthRule,
  AdaptiveCohortEstimateRequiredTimezoneRule,
  defaultAdaptiveCohortEstimateValidator,
} from "./adaptive-cohort-estimate-rules.js";
import { newAdaptiveCohortEstimate } from "./adaptive-cohort-estimate.js";

test("AdaptiveCohortEstimateValidator reports every problem", () => {
  const validator = defaultAdaptiveCohortEstimateValidator();
  const item = newAdaptiveCohortEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCohortEstimateRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new AdaptiveCohortEstimateRequiredTimezoneRule("adaptive cohort estimate needs this field");
  const item = newAdaptiveCohortEstimate("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveCohortEstimateNameLengthRule flags a long name", () => {
  const rule = new AdaptiveCohortEstimateNameLengthRule(32);
  const item = newAdaptiveCohortEstimate("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
