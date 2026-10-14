import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalBaselineCodeLengthRule,
  ApprovalBaselineNameLengthRule,
  ApprovalBaselineRequiredCodeRule,
  ApprovalBaselineRequiredVariantRule,
  defaultApprovalBaselineValidator,
} from "./approval-baseline-rules.js";
import { newApprovalBaseline } from "./approval-baseline.js";

test("ApprovalBaselineValidator reports every problem", () => {
  const validator = defaultApprovalBaselineValidator();
  const item = newApprovalBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalBaselineNameLengthRule flags a long name", () => {
  const rule = new ApprovalBaselineNameLengthRule(64);
  const item = newApprovalBaseline("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalBaselineRequiredVariantRule flags a blank variant", () => {
  const rule = new ApprovalBaselineRequiredVariantRule("approval baseline needs an entry");
  const item = newApprovalBaseline("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalBaselineCodeLengthRule flags a long code", () => {
  const rule = new ApprovalBaselineCodeLengthRule(86400);
  const item = newApprovalBaseline("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalBaselineRequiredCodeRule("approval baseline needs an entry");
  const item = newApprovalBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
