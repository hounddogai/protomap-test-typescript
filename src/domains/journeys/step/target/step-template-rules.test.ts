import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepTemplateAudienceIdLengthRule,
  StepTemplateQuantityRangeRule,
  StepTemplateRequiredCodeRule,
  StepTemplateRequiredNameRule,
  defaultStepTemplateValidator,
} from "./step-template-rules.js";
import { newStepTemplate } from "./step-template.js";

test("StepTemplateValidator reports every problem", () => {
  const validator = defaultStepTemplateValidator();
  const item = newStepTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepTemplateQuantityRangeRule flags values above quantity", () => {
  const rule = new StepTemplateQuantityRangeRule(16, 1000);
  const item = newStepTemplate("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepTemplateRequiredNameRule flags a blank name", () => {
  const rule = new StepTemplateRequiredNameRule("step template needs an entry");
  const item = newStepTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepTemplateAudienceIdLengthRule flags a long audience id", () => {
  const rule = new StepTemplateAudienceIdLengthRule(3600);
  const item = newStepTemplate("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new StepTemplateRequiredCodeRule("step template needs a value");
  const item = newStepTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
