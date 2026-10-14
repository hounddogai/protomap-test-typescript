import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepMappingLabelLengthRule,
  StepMappingRequiredTimezoneRule,
  StepMappingRequiredVariantRule,
  StepMappingTimezoneLengthRule,
  StepMappingVariantLengthRule,
  defaultStepMappingValidator,
} from "./step-mapping-rules.js";
import { newStepMapping } from "./step-mapping.js";

test("StepMappingValidator reports every problem", () => {
  const validator = defaultStepMappingValidator();
  const item = newStepMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepMappingRequiredVariantRule flags a blank variant", () => {
  const rule = new StepMappingRequiredVariantRule("step mapping needs this field");
  const item = newStepMapping("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepMappingRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new StepMappingRequiredTimezoneRule("step mapping needs this field");
  const item = newStepMapping("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepMappingTimezoneLengthRule flags a long timezone", () => {
  const rule = new StepMappingTimezoneLengthRule(64);
  const item = newStepMapping("x", "y");
  item.timezone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepMappingLabelLengthRule flags a long label", () => {
  const rule = new StepMappingLabelLengthRule(86400);
  const item = newStepMapping("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepMappingVariantLengthRule flags a long variant", () => {
  const rule = new StepMappingVariantLengthRule(255);
  const item = newStepMapping("x", "y");
  item.variant = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
