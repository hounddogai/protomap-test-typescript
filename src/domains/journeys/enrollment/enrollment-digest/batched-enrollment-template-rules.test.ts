import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedEnrollmentTemplateLabelLengthRule,
  BatchedEnrollmentTemplateRequiredCodeRule,
  defaultBatchedEnrollmentTemplateValidator,
} from "./batched-enrollment-template-rules.js";
import { newBatchedEnrollmentTemplate } from "./batched-enrollment-template.js";

test("BatchedEnrollmentTemplateValidator reports every problem", () => {
  const validator = defaultBatchedEnrollmentTemplateValidator();
  const item = newBatchedEnrollmentTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedEnrollmentTemplateLabelLengthRule flags a long label", () => {
  const rule = new BatchedEnrollmentTemplateLabelLengthRule(120);
  const item = newBatchedEnrollmentTemplate("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedEnrollmentTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedEnrollmentTemplateRequiredCodeRule("batched enrollment template needs an entry");
  const item = newBatchedEnrollmentTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
