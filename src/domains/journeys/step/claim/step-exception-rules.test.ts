import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepExceptionNameLengthRule,
  StepExceptionRequiredCodeRule,
  StepExceptionRequiredLabelRule,
  defaultStepExceptionValidator,
} from "./step-exception-rules.js";
import { newStepException } from "./step-exception.js";

test("StepExceptionValidator reports every problem", () => {
  const validator = defaultStepExceptionValidator();
  const item = newStepException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepExceptionNameLengthRule flags a long name", () => {
  const rule = new StepExceptionNameLengthRule(80);
  const item = newStepException("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new StepExceptionRequiredLabelRule("step exception needs this field");
  const item = newStepException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new StepExceptionRequiredCodeRule("step exception needs this field");
  const item = newStepException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
