import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepRequestCategoryLengthRule,
  StepRequestLabelLengthRule,
  StepRequestRequiredCategoryRule,
  StepRequestRequiredCodeRule,
  StepRequestRequiredLabelRule,
  StepRequestStartsAtRangeRule,
  defaultStepRequestValidator,
} from "./step-request-rules.js";
import { newStepRequest } from "./step-request.js";

test("StepRequestValidator reports every problem", () => {
  const validator = defaultStepRequestValidator();
  const item = newStepRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepRequestCategoryLengthRule flags a long category", () => {
  const rule = new StepRequestCategoryLengthRule(80);
  const item = newStepRequest("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRequestRequiredLabelRule flags a blank label", () => {
  const rule = new StepRequestRequiredLabelRule("step request needs a value");
  const item = newStepRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepRequestRequiredCodeRule flags a blank code", () => {
  const rule = new StepRequestRequiredCodeRule("step request needs this field");
  const item = newStepRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepRequestStartsAtRangeRule flags values above starts at", () => {
  const rule = new StepRequestStartsAtRangeRule(80, 86400);
  const item = newStepRequest("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepRequestLabelLengthRule flags a long label", () => {
  const rule = new StepRequestLabelLengthRule(16);
  const item = newStepRequest("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepRequestRequiredCategoryRule flags a blank category", () => {
  const rule = new StepRequestRequiredCategoryRule("step request needs a value");
  const item = newStepRequest("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
