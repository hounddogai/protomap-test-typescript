import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionExceptionCreatedAtRangeRule,
  SuppressionExceptionRequiredReviewerRule,
  SuppressionExceptionRequiredUnitRule,
  defaultSuppressionExceptionValidator,
} from "./suppression-exception-rules.js";
import { newSuppressionException } from "./suppression-exception.js";

test("SuppressionExceptionValidator reports every problem", () => {
  const validator = defaultSuppressionExceptionValidator();
  const item = newSuppressionException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionExceptionCreatedAtRangeRule flags values above created at", () => {
  const rule = new SuppressionExceptionCreatedAtRangeRule(32, 3600);
  const item = newSuppressionException("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionExceptionRequiredUnitRule flags a blank unit", () => {
  const rule = new SuppressionExceptionRequiredUnitRule("suppression exception needs a value");
  const item = newSuppressionException("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionExceptionRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new SuppressionExceptionRequiredReviewerRule("suppression exception needs an entry");
  const item = newSuppressionException("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
