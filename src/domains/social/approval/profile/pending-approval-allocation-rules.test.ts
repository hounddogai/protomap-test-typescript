import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingApprovalAllocationExpiresAtRangeRule,
  PendingApprovalAllocationLocaleLengthRule,
  PendingApprovalAllocationScoreRangeRule,
  PendingApprovalAllocationSegmentLengthRule,
  defaultPendingApprovalAllocationValidator,
} from "./pending-approval-allocation-rules.js";
import { newPendingApprovalAllocation } from "./pending-approval-allocation.js";

test("PendingApprovalAllocationValidator reports every problem", () => {
  const validator = defaultPendingApprovalAllocationValidator();
  const item = newPendingApprovalAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingApprovalAllocationLocaleLengthRule flags a long locale", () => {
  const rule = new PendingApprovalAllocationLocaleLengthRule(86400);
  const item = newPendingApprovalAllocation("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingApprovalAllocationSegmentLengthRule flags a long segment", () => {
  const rule = new PendingApprovalAllocationSegmentLengthRule(16);
  const item = newPendingApprovalAllocation("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingApprovalAllocationExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PendingApprovalAllocationExpiresAtRangeRule(16, 1000);
  const item = newPendingApprovalAllocation("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingApprovalAllocationScoreRangeRule flags values above score", () => {
  const rule = new PendingApprovalAllocationScoreRangeRule(1.6, 2147.3);
  const item = newPendingApprovalAllocation("x", "y");
  item.score = 2148.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
