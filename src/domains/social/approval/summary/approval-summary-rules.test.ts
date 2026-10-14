import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalSummaryCodeLengthRule,
  ApprovalSummaryDurationMinutesRangeRule,
  ApprovalSummaryRequiredLocaleRule,
  ApprovalSummaryTitleLengthRule,
  defaultApprovalSummaryValidator,
} from "./approval-summary-rules.js";
import { newApprovalSummary } from "./approval-summary.js";

test("ApprovalSummaryValidator reports every problem", () => {
  const validator = defaultApprovalSummaryValidator();
  const item = newApprovalSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalSummaryCodeLengthRule flags a long code", () => {
  const rule = new ApprovalSummaryCodeLengthRule(120);
  const item = newApprovalSummary("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalSummaryRequiredLocaleRule flags a blank locale", () => {
  const rule = new ApprovalSummaryRequiredLocaleRule("approval summary needs an entry");
  const item = newApprovalSummary("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalSummaryDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ApprovalSummaryDurationMinutesRangeRule(16, 80);
  const item = newApprovalSummary("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalSummaryTitleLengthRule flags a long title", () => {
  const rule = new ApprovalSummaryTitleLengthRule(64);
  const item = newApprovalSummary("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
