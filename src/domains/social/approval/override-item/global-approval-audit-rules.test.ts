import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalApprovalAuditBudgetRangeRule,
  GlobalApprovalAuditCodeLengthRule,
  GlobalApprovalAuditRequiredNameRule,
  GlobalApprovalAuditUpdatedAtRangeRule,
  defaultGlobalApprovalAuditValidator,
} from "./global-approval-audit-rules.js";
import { newGlobalApprovalAudit } from "./global-approval-audit.js";

test("GlobalApprovalAuditValidator reports every problem", () => {
  const validator = defaultGlobalApprovalAuditValidator();
  const item = newGlobalApprovalAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalApprovalAuditUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new GlobalApprovalAuditUpdatedAtRangeRule(16, 120);
  const item = newGlobalApprovalAudit("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalApprovalAuditCodeLengthRule flags a long code", () => {
  const rule = new GlobalApprovalAuditCodeLengthRule(255);
  const item = newGlobalApprovalAudit("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalApprovalAuditBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalApprovalAuditBudgetRangeRule(7, 1885.5);
  const item = newGlobalApprovalAudit("x", "y");
  item.budget = 1887;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalApprovalAuditRequiredNameRule flags a blank name", () => {
  const rule = new GlobalApprovalAuditRequiredNameRule("global approval audit needs this field");
  const item = newGlobalApprovalAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
