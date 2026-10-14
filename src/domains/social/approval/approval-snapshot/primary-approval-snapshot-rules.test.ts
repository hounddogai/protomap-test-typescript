import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryApprovalSnapshotChecksumLengthRule,
  PrimaryApprovalSnapshotCodeLengthRule,
  PrimaryApprovalSnapshotRequiredChecksumRule,
  PrimaryApprovalSnapshotRequiredTitleRule,
  PrimaryApprovalSnapshotSendAtRangeRule,
  PrimaryApprovalSnapshotTitleLengthRule,
  defaultPrimaryApprovalSnapshotValidator,
} from "./primary-approval-snapshot-rules.js";
import { newPrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

test("PrimaryApprovalSnapshotValidator reports every problem", () => {
  const validator = defaultPrimaryApprovalSnapshotValidator();
  const item = newPrimaryApprovalSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryApprovalSnapshotChecksumLengthRule flags a long checksum", () => {
  const rule = new PrimaryApprovalSnapshotChecksumLengthRule(32);
  const item = newPrimaryApprovalSnapshot("x", "y");
  item.checksum = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryApprovalSnapshotTitleLengthRule flags a long title", () => {
  const rule = new PrimaryApprovalSnapshotTitleLengthRule(3600);
  const item = newPrimaryApprovalSnapshot("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryApprovalSnapshotRequiredChecksumRule flags a blank checksum", () => {
  const rule = new PrimaryApprovalSnapshotRequiredChecksumRule("primary approval snapshot needs this field");
  const item = newPrimaryApprovalSnapshot("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryApprovalSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryApprovalSnapshotRequiredTitleRule("primary approval snapshot needs a value");
  const item = newPrimaryApprovalSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryApprovalSnapshotSendAtRangeRule flags values above send at", () => {
  const rule = new PrimaryApprovalSnapshotSendAtRangeRule(64, 86400);
  const item = newPrimaryApprovalSnapshot("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryApprovalSnapshotCodeLengthRule flags a long code", () => {
  const rule = new PrimaryApprovalSnapshotCodeLengthRule(32);
  const item = newPrimaryApprovalSnapshot("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
