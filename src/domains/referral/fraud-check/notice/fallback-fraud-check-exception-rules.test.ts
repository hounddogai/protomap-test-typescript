import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFraudCheckExceptionCreatedAtRangeRule,
  FallbackFraudCheckExceptionRequiredCodeRule,
  FallbackFraudCheckExceptionRequiredCohortRule,
  FallbackFraudCheckExceptionRequiredLabelRule,
  defaultFallbackFraudCheckExceptionValidator,
} from "./fallback-fraud-check-exception-rules.js";
import { newFallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

test("FallbackFraudCheckExceptionValidator reports every problem", () => {
  const validator = defaultFallbackFraudCheckExceptionValidator();
  const item = newFallbackFraudCheckException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFraudCheckExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackFraudCheckExceptionRequiredLabelRule("fallback fraud check exception needs this field");
  const item = newFallbackFraudCheckException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFraudCheckExceptionRequiredCohortRule flags a blank cohort", () => {
  const rule = new FallbackFraudCheckExceptionRequiredCohortRule("fallback fraud check exception needs an entry");
  const item = newFallbackFraudCheckException("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFraudCheckExceptionCreatedAtRangeRule flags values above created at", () => {
  const rule = new FallbackFraudCheckExceptionCreatedAtRangeRule(32, 80);
  const item = newFallbackFraudCheckException("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackFraudCheckExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackFraudCheckExceptionRequiredCodeRule("fallback fraud check exception needs an entry");
  const item = newFallbackFraudCheckException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
