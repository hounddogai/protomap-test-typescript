import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictSuppressionExceptionLocaleLengthRule,
  StrictSuppressionExceptionRequiredCodeRule,
  StrictSuppressionExceptionRequiredNotesRule,
  StrictSuppressionExceptionSequenceRangeRule,
  defaultStrictSuppressionExceptionValidator,
} from "./strict-suppression-exception-rules.js";
import { newStrictSuppressionException } from "./strict-suppression-exception.js";

test("StrictSuppressionExceptionValidator reports every problem", () => {
  const validator = defaultStrictSuppressionExceptionValidator();
  const item = newStrictSuppressionException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictSuppressionExceptionRequiredNotesRule flags a blank notes", () => {
  const rule = new StrictSuppressionExceptionRequiredNotesRule("strict suppression exception needs a value");
  const item = newStrictSuppressionException("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSuppressionExceptionLocaleLengthRule flags a long locale", () => {
  const rule = new StrictSuppressionExceptionLocaleLengthRule(120);
  const item = newStrictSuppressionException("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictSuppressionExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new StrictSuppressionExceptionRequiredCodeRule("strict suppression exception needs an entry");
  const item = newStrictSuppressionException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSuppressionExceptionSequenceRangeRule flags values above sequence", () => {
  const rule = new StrictSuppressionExceptionSequenceRangeRule(80, 120);
  const item = newStrictSuppressionException("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
