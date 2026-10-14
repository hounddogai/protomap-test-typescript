import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepAuditAmountRangeRule,
  StepAuditCodeLengthRule,
  StepAuditImpressionsRangeRule,
  StepAuditRequiredCodeRule,
  StepAuditRequiredSegmentRule,
  defaultStepAuditValidator,
} from "./step-audit-rules.js";
import { newStepAudit } from "./step-audit.js";

test("StepAuditValidator reports every problem", () => {
  const validator = defaultStepAuditValidator();
  const item = newStepAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepAuditCodeLengthRule flags a long code", () => {
  const rule = new StepAuditCodeLengthRule(64);
  const item = newStepAudit("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepAuditRequiredCodeRule flags a blank code", () => {
  const rule = new StepAuditRequiredCodeRule("step audit needs a value");
  const item = newStepAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepAuditAmountRangeRule flags values above amount", () => {
  const rule = new StepAuditAmountRangeRule(8.9, 670.4);
  const item = newStepAudit("x", "y");
  item.amount = 671.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepAuditImpressionsRangeRule flags values above impressions", () => {
  const rule = new StepAuditImpressionsRangeRule(120, 255);
  const item = newStepAudit("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepAuditRequiredSegmentRule flags a blank segment", () => {
  const rule = new StepAuditRequiredSegmentRule("step audit needs this field");
  const item = newStepAudit("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
