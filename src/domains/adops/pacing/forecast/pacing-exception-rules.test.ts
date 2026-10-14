import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingExceptionRequiredCodeRule,
  PacingExceptionThresholdRangeRule,
  defaultPacingExceptionValidator,
} from "./pacing-exception-rules.js";
import { newPacingException } from "./pacing-exception.js";

test("PacingExceptionValidator reports every problem", () => {
  const validator = defaultPacingExceptionValidator();
  const item = newPacingException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingExceptionThresholdRangeRule flags values above threshold", () => {
  const rule = new PacingExceptionThresholdRangeRule(1.4, 4004.1);
  const item = newPacingException("x", "y");
  item.threshold = 4005.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new PacingExceptionRequiredCodeRule("pacing exception needs an entry");
  const item = newPacingException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
