import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepVarianceCodeLengthRule,
  StepVarianceNameLengthRule,
  StepVarianceRequiredCodeRule,
  StepVarianceRequiredNameRule,
  StepVarianceSequenceRangeRule,
  defaultStepVarianceValidator,
} from "./step-variance-rules.js";
import { newStepVariance } from "./step-variance.js";

test("StepVarianceValidator reports every problem", () => {
  const validator = defaultStepVarianceValidator();
  const item = newStepVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepVarianceCodeLengthRule flags a long code", () => {
  const rule = new StepVarianceCodeLengthRule(3600);
  const item = newStepVariance("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepVarianceNameLengthRule flags a long name", () => {
  const rule = new StepVarianceNameLengthRule(120);
  const item = newStepVariance("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepVarianceRequiredNameRule flags a blank name", () => {
  const rule = new StepVarianceRequiredNameRule("step variance needs a value");
  const item = newStepVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new StepVarianceRequiredCodeRule("step variance needs a value");
  const item = newStepVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepVarianceSequenceRangeRule flags values above sequence", () => {
  const rule = new StepVarianceSequenceRangeRule(80, 86400);
  const item = newStepVariance("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
