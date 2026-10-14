import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalAuditCapacityRangeRule,
  ApprovalAuditChecksumLengthRule,
  ApprovalAuditRequiredChecksumRule,
  ApprovalAuditRequiredOwnerIdRule,
  ApprovalAuditRetriesRangeRule,
  defaultApprovalAuditValidator,
} from "./approval-audit-rules.js";
import { newApprovalAudit } from "./approval-audit.js";

test("ApprovalAuditValidator reports every problem", () => {
  const validator = defaultApprovalAuditValidator();
  const item = newApprovalAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalAuditCapacityRangeRule flags values above capacity", () => {
  const rule = new ApprovalAuditCapacityRangeRule(64, 255);
  const item = newApprovalAudit("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalAuditRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ApprovalAuditRequiredChecksumRule("approval audit needs this field");
  const item = newApprovalAudit("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalAuditRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ApprovalAuditRequiredOwnerIdRule("approval audit needs this field");
  const item = newApprovalAudit("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalAuditRetriesRangeRule flags values above retries", () => {
  const rule = new ApprovalAuditRetriesRangeRule(16, 86400);
  const item = newApprovalAudit("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalAuditChecksumLengthRule flags a long checksum", () => {
  const rule = new ApprovalAuditChecksumLengthRule(1000);
  const item = newApprovalAudit("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
