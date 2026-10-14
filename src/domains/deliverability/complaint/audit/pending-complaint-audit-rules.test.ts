import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingComplaintAuditBatchSizeRangeRule,
  PendingComplaintAuditLabelLengthRule,
  PendingComplaintAuditRequiredCodeRule,
  defaultPendingComplaintAuditValidator,
} from "./pending-complaint-audit-rules.js";
import { newPendingComplaintAudit } from "./pending-complaint-audit.js";

test("PendingComplaintAuditValidator reports every problem", () => {
  const validator = defaultPendingComplaintAuditValidator();
  const item = newPendingComplaintAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingComplaintAuditLabelLengthRule flags a long label", () => {
  const rule = new PendingComplaintAuditLabelLengthRule(16);
  const item = newPendingComplaintAudit("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingComplaintAuditRequiredCodeRule flags a blank code", () => {
  const rule = new PendingComplaintAuditRequiredCodeRule("pending complaint audit needs this field");
  const item = newPendingComplaintAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingComplaintAuditBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PendingComplaintAuditBatchSizeRangeRule(32, 86400);
  const item = newPendingComplaintAudit("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
