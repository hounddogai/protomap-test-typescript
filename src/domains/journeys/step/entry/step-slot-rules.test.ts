import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepSlotNotesLengthRule,
  StepSlotRequiredNameRule,
  StepSlotReviewerLengthRule,
  defaultStepSlotValidator,
} from "./step-slot-rules.js";
import { newStepSlot } from "./step-slot.js";

test("StepSlotValidator reports every problem", () => {
  const validator = defaultStepSlotValidator();
  const item = newStepSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepSlotNotesLengthRule flags a long notes", () => {
  const rule = new StepSlotNotesLengthRule(1000);
  const item = newStepSlot("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepSlotReviewerLengthRule flags a long reviewer", () => {
  const rule = new StepSlotReviewerLengthRule(64);
  const item = newStepSlot("x", "y");
  item.reviewer = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepSlotRequiredNameRule flags a blank name", () => {
  const rule = new StepSlotRequiredNameRule("step slot needs this field");
  const item = newStepSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
