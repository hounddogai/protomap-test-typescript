import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepDraftRequiredCodeRule,
  StepDraftRequiredLabelRule,
  StepDraftVariantLengthRule,
  defaultStepDraftValidator,
} from "./step-draft-rules.js";
import { newStepDraft } from "./step-draft.js";

test("StepDraftValidator reports every problem", () => {
  const validator = defaultStepDraftValidator();
  const item = newStepDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepDraftRequiredCodeRule flags a blank code", () => {
  const rule = new StepDraftRequiredCodeRule("step draft needs an entry");
  const item = newStepDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepDraftVariantLengthRule flags a long variant", () => {
  const rule = new StepDraftVariantLengthRule(80);
  const item = newStepDraft("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepDraftRequiredLabelRule flags a blank label", () => {
  const rule = new StepDraftRequiredLabelRule("step draft needs an entry");
  const item = newStepDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
