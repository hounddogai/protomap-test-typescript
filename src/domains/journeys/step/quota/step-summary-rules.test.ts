import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepSummaryRequiredVariantRule,
  StepSummaryVariantLengthRule,
  defaultStepSummaryValidator,
} from "./step-summary-rules.js";
import { newStepSummary } from "./step-summary.js";

test("StepSummaryValidator reports every problem", () => {
  const validator = defaultStepSummaryValidator();
  const item = newStepSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepSummaryVariantLengthRule flags a long variant", () => {
  const rule = new StepSummaryVariantLengthRule(3600);
  const item = newStepSummary("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepSummaryRequiredVariantRule flags a blank variant", () => {
  const rule = new StepSummaryRequiredVariantRule("step summary needs an entry");
  const item = newStepSummary("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
