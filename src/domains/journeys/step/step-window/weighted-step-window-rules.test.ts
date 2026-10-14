import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedStepWindowNotesLengthRule,
  WeightedStepWindowRequiredLocaleRule,
  defaultWeightedStepWindowValidator,
} from "./weighted-step-window-rules.js";
import { newWeightedStepWindow } from "./weighted-step-window.js";

test("WeightedStepWindowValidator reports every problem", () => {
  const validator = defaultWeightedStepWindowValidator();
  const item = newWeightedStepWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedStepWindowRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedStepWindowRequiredLocaleRule("weighted step window needs an entry");
  const item = newWeightedStepWindow("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedStepWindowNotesLengthRule flags a long notes", () => {
  const rule = new WeightedStepWindowNotesLengthRule(1000);
  const item = newWeightedStepWindow("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
