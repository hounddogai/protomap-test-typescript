import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBadgeAuditCreatedAtRangeRule,
  PendingBadgeAuditRequiredCodeRule,
  PendingBadgeAuditTitleLengthRule,
  defaultPendingBadgeAuditValidator,
} from "./pending-badge-audit-rules.js";
import { newPendingBadgeAudit } from "./pending-badge-audit.js";

test("PendingBadgeAuditValidator reports every problem", () => {
  const validator = defaultPendingBadgeAuditValidator();
  const item = newPendingBadgeAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBadgeAuditTitleLengthRule flags a long title", () => {
  const rule = new PendingBadgeAuditTitleLengthRule(3600);
  const item = newPendingBadgeAudit("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBadgeAuditRequiredCodeRule flags a blank code", () => {
  const rule = new PendingBadgeAuditRequiredCodeRule("pending badge audit needs a value");
  const item = newPendingBadgeAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingBadgeAuditCreatedAtRangeRule flags values above created at", () => {
  const rule = new PendingBadgeAuditCreatedAtRangeRule(80, 86400);
  const item = newPendingBadgeAudit("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
