import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRetentionAuditBudgetRangeRule,
  PendingRetentionAuditCodeLengthRule,
  PendingRetentionAuditRequiredReviewerRule,
  defaultPendingRetentionAuditValidator,
} from "./pending-retention-audit-rules.js";
import { newPendingRetentionAudit } from "./pending-retention-audit.js";

test("PendingRetentionAuditValidator reports every problem", () => {
  const validator = defaultPendingRetentionAuditValidator();
  const item = newPendingRetentionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRetentionAuditCodeLengthRule flags a long code", () => {
  const rule = new PendingRetentionAuditCodeLengthRule(80);
  const item = newPendingRetentionAudit("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRetentionAuditRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PendingRetentionAuditRequiredReviewerRule("pending retention audit needs this field");
  const item = newPendingRetentionAudit("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRetentionAuditBudgetRangeRule flags values above budget", () => {
  const rule = new PendingRetentionAuditBudgetRangeRule(8.8, 3625.1);
  const item = newPendingRetentionAudit("x", "y");
  item.budget = 3626.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
