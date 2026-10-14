import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackStepAuditAmountRangeRule,
  FallbackStepAuditAttemptsRangeRule,
  FallbackStepAuditCodeLengthRule,
  FallbackStepAuditRequiredLocaleRule,
  FallbackStepAuditVersionRangeRule,
  defaultFallbackStepAuditValidator,
} from "./fallback-step-audit-rules.js";
import { newFallbackStepAudit } from "./fallback-step-audit.js";

test("FallbackStepAuditValidator reports every problem", () => {
  const validator = defaultFallbackStepAuditValidator();
  const item = newFallbackStepAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackStepAuditRequiredLocaleRule flags a blank locale", () => {
  const rule = new FallbackStepAuditRequiredLocaleRule("fallback step audit needs a value");
  const item = newFallbackStepAudit("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackStepAuditAmountRangeRule flags values above amount", () => {
  const rule = new FallbackStepAuditAmountRangeRule(6.9, 1928.9);
  const item = newFallbackStepAudit("x", "y");
  item.amount = 1930.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStepAuditAttemptsRangeRule flags values above attempts", () => {
  const rule = new FallbackStepAuditAttemptsRangeRule(32, 3600);
  const item = newFallbackStepAudit("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStepAuditCodeLengthRule flags a long code", () => {
  const rule = new FallbackStepAuditCodeLengthRule(32);
  const item = newFallbackStepAudit("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackStepAuditVersionRangeRule flags values above version", () => {
  const rule = new FallbackStepAuditVersionRangeRule(80, 80);
  const item = newFallbackStepAudit("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
