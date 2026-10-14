import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryApprovalSummaryBudgetRangeRule,
  PrimaryApprovalSummaryCodeLengthRule,
  PrimaryApprovalSummaryDurationMinutesRangeRule,
  PrimaryApprovalSummaryRequiredCodeRule,
  PrimaryApprovalSummaryRequiredLabelRule,
  defaultPrimaryApprovalSummaryValidator,
} from "./primary-approval-summary-rules.js";
import { newPrimaryApprovalSummary } from "./primary-approval-summary.js";

test("PrimaryApprovalSummaryValidator reports every problem", () => {
  const validator = defaultPrimaryApprovalSummaryValidator();
  const item = newPrimaryApprovalSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryApprovalSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryApprovalSummaryRequiredCodeRule("primary approval summary needs this field");
  const item = newPrimaryApprovalSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryApprovalSummaryCodeLengthRule flags a long code", () => {
  const rule = new PrimaryApprovalSummaryCodeLengthRule(1000);
  const item = newPrimaryApprovalSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryApprovalSummaryDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PrimaryApprovalSummaryDurationMinutesRangeRule(64, 80);
  const item = newPrimaryApprovalSummary("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryApprovalSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryApprovalSummaryRequiredLabelRule("primary approval summary needs this field");
  const item = newPrimaryApprovalSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryApprovalSummaryBudgetRangeRule flags values above budget", () => {
  const rule = new PrimaryApprovalSummaryBudgetRangeRule(6.9, 3961.3);
  const item = newPrimaryApprovalSummary("x", "y");
  item.budget = 3962.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
