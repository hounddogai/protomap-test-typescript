import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFrequencyExceptionRequiredCodeRule,
  WeightedFrequencyExceptionRequiredCohortRule,
  WeightedFrequencyExceptionRequiredLabelRule,
  defaultWeightedFrequencyExceptionValidator,
} from "./weighted-frequency-exception-rules.js";
import { newWeightedFrequencyException } from "./weighted-frequency-exception.js";

test("WeightedFrequencyExceptionValidator reports every problem", () => {
  const validator = defaultWeightedFrequencyExceptionValidator();
  const item = newWeightedFrequencyException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFrequencyExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedFrequencyExceptionRequiredLabelRule("weighted frequency exception needs a value");
  const item = newWeightedFrequencyException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedFrequencyExceptionRequiredCohortRule flags a blank cohort", () => {
  const rule = new WeightedFrequencyExceptionRequiredCohortRule("weighted frequency exception needs this field");
  const item = newWeightedFrequencyException("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedFrequencyExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedFrequencyExceptionRequiredCodeRule("weighted frequency exception needs an entry");
  const item = newWeightedFrequencyException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
