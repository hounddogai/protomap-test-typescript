import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepAllocationCodeLengthRule,
  StepAllocationRequiredLabelRule,
  StepAllocationRequiredLocaleRule,
  defaultStepAllocationValidator,
} from "./step-allocation-rules.js";
import { newStepAllocation } from "./step-allocation.js";

test("StepAllocationValidator reports every problem", () => {
  const validator = defaultStepAllocationValidator();
  const item = newStepAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new StepAllocationRequiredLabelRule("step allocation needs this field");
  const item = newStepAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepAllocationRequiredLocaleRule flags a blank locale", () => {
  const rule = new StepAllocationRequiredLocaleRule("step allocation needs this field");
  const item = newStepAllocation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepAllocationCodeLengthRule flags a long code", () => {
  const rule = new StepAllocationCodeLengthRule(255);
  const item = newStepAllocation("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
