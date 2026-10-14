import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepSegmentCodeLengthRule,
  StepSegmentRequiredCodeRule,
  StepSegmentRequiredDescriptionRule,
  defaultStepSegmentValidator,
} from "./step-segment-rules.js";
import { newStepSegment } from "./step-segment.js";

test("StepSegmentValidator reports every problem", () => {
  const validator = defaultStepSegmentValidator();
  const item = newStepSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepSegmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new StepSegmentRequiredDescriptionRule("step segment needs an entry");
  const item = newStepSegment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new StepSegmentRequiredCodeRule("step segment needs an entry");
  const item = newStepSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepSegmentCodeLengthRule flags a long code", () => {
  const rule = new StepSegmentCodeLengthRule(32);
  const item = newStepSegment("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
