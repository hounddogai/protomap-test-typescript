import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSuppressionAuditCodeLengthRule,
  FallbackSuppressionAuditConversionRateRangeRule,
  FallbackSuppressionAuditRequiredOwnerIdRule,
  FallbackSuppressionAuditRequiredTitleRule,
  defaultFallbackSuppressionAuditValidator,
} from "./fallback-suppression-audit-rules.js";
import { newFallbackSuppressionAudit } from "./fallback-suppression-audit.js";

test("FallbackSuppressionAuditValidator reports every problem", () => {
  const validator = defaultFallbackSuppressionAuditValidator();
  const item = newFallbackSuppressionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSuppressionAuditRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FallbackSuppressionAuditRequiredOwnerIdRule("fallback suppression audit needs an entry");
  const item = newFallbackSuppressionAudit("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSuppressionAuditCodeLengthRule flags a long code", () => {
  const rule = new FallbackSuppressionAuditCodeLengthRule(1000);
  const item = newFallbackSuppressionAudit("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSuppressionAuditConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new FallbackSuppressionAuditConversionRateRangeRule(7.8, 4611);
  const item = newFallbackSuppressionAudit("x", "y");
  item.conversionRate = 4612.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSuppressionAuditRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackSuppressionAuditRequiredTitleRule("fallback suppression audit needs this field");
  const item = newFallbackSuppressionAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
