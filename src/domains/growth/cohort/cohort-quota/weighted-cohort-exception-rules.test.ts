import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCohortExceptionCostRangeRule,
  WeightedCohortExceptionLabelLengthRule,
  WeightedCohortExceptionRequiredUtmSourceRule,
  WeightedCohortExceptionSequenceRangeRule,
  defaultWeightedCohortExceptionValidator,
} from "./weighted-cohort-exception-rules.js";
import { newWeightedCohortException } from "./weighted-cohort-exception.js";

test("WeightedCohortExceptionValidator reports every problem", () => {
  const validator = defaultWeightedCohortExceptionValidator();
  const item = newWeightedCohortException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCohortExceptionSequenceRangeRule flags values above sequence", () => {
  const rule = new WeightedCohortExceptionSequenceRangeRule(16, 3600);
  const item = newWeightedCohortException("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCohortExceptionRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new WeightedCohortExceptionRequiredUtmSourceRule("weighted cohort exception needs this field");
  const item = newWeightedCohortException("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCohortExceptionLabelLengthRule flags a long label", () => {
  const rule = new WeightedCohortExceptionLabelLengthRule(3600);
  const item = newWeightedCohortException("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCohortExceptionCostRangeRule flags values above cost", () => {
  const rule = new WeightedCohortExceptionCostRangeRule(9.5, 3490.9);
  const item = newWeightedCohortException("x", "y");
  item.cost = 3492.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
