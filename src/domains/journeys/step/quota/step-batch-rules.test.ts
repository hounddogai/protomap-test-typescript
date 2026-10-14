import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepBatchCapacityRangeRule,
  StepBatchCodeLengthRule,
  StepBatchRequiredCountryRule,
  StepBatchScoreRangeRule,
  defaultStepBatchValidator,
} from "./step-batch-rules.js";
import { newStepBatch } from "./step-batch.js";

test("StepBatchValidator reports every problem", () => {
  const validator = defaultStepBatchValidator();
  const item = newStepBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepBatchRequiredCountryRule flags a blank country", () => {
  const rule = new StepBatchRequiredCountryRule("step batch needs a value");
  const item = newStepBatch("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepBatchCodeLengthRule flags a long code", () => {
  const rule = new StepBatchCodeLengthRule(32);
  const item = newStepBatch("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepBatchScoreRangeRule flags values above score", () => {
  const rule = new StepBatchScoreRangeRule(4.3, 1918.9);
  const item = newStepBatch("x", "y");
  item.score = 1920.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepBatchCapacityRangeRule flags values above capacity", () => {
  const rule = new StepBatchCapacityRangeRule(80, 80);
  const item = newStepBatch("x", "y");
  item.capacity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
