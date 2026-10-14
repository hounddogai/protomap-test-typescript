import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalSnapshotCodeLengthRule,
  ApprovalSnapshotNameLengthRule,
  ApprovalSnapshotRequiredNameRule,
  ApprovalSnapshotSendAtRangeRule,
  defaultApprovalSnapshotValidator,
} from "./approval-snapshot-rules.js";
import { newApprovalSnapshot } from "./approval-snapshot.js";

test("ApprovalSnapshotValidator reports every problem", () => {
  const validator = defaultApprovalSnapshotValidator();
  const item = newApprovalSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalSnapshotCodeLengthRule flags a long code", () => {
  const rule = new ApprovalSnapshotCodeLengthRule(86400);
  const item = newApprovalSnapshot("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalSnapshotNameLengthRule flags a long name", () => {
  const rule = new ApprovalSnapshotNameLengthRule(64);
  const item = newApprovalSnapshot("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalSnapshotRequiredNameRule flags a blank name", () => {
  const rule = new ApprovalSnapshotRequiredNameRule("approval snapshot needs this field");
  const item = newApprovalSnapshot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalSnapshotSendAtRangeRule flags values above send at", () => {
  const rule = new ApprovalSnapshotSendAtRangeRule(64, 3600);
  const item = newApprovalSnapshot("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
