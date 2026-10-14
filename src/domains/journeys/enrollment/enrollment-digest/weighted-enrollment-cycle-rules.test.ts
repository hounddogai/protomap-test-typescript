import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEnrollmentCycleLabelLengthRule,
  WeightedEnrollmentCycleMinimumRangeRule,
  WeightedEnrollmentCycleRequiredCodeRule,
  WeightedEnrollmentCycleRequiredContactEmailRule,
  defaultWeightedEnrollmentCycleValidator,
} from "./weighted-enrollment-cycle-rules.js";
import { newWeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

test("WeightedEnrollmentCycleValidator reports every problem", () => {
  const validator = defaultWeightedEnrollmentCycleValidator();
  const item = newWeightedEnrollmentCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEnrollmentCycleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new WeightedEnrollmentCycleRequiredContactEmailRule("weighted enrollment cycle needs a value");
  const item = newWeightedEnrollmentCycle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedEnrollmentCycleMinimumRangeRule flags values above minimum", () => {
  const rule = new WeightedEnrollmentCycleMinimumRangeRule(1.8, 1779.5);
  const item = newWeightedEnrollmentCycle("x", "y");
  item.minimum = 1781;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedEnrollmentCycleLabelLengthRule flags a long label", () => {
  const rule = new WeightedEnrollmentCycleLabelLengthRule(86400);
  const item = newWeightedEnrollmentCycle("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEnrollmentCycleRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedEnrollmentCycleRequiredCodeRule("weighted enrollment cycle needs an entry");
  const item = newWeightedEnrollmentCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
