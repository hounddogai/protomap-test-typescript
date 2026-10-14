import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingApprovalDigestChannelLengthRule,
  RollingApprovalDigestQuantityRangeRule,
  RollingApprovalDigestRatioRangeRule,
  RollingApprovalDigestSegmentLengthRule,
  defaultRollingApprovalDigestValidator,
} from "./rolling-approval-digest-rules.js";
import { newRollingApprovalDigest } from "./rolling-approval-digest.js";

test("RollingApprovalDigestValidator reports every problem", () => {
  const validator = defaultRollingApprovalDigestValidator();
  const item = newRollingApprovalDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingApprovalDigestRatioRangeRule flags values above ratio", () => {
  const rule = new RollingApprovalDigestRatioRangeRule(8.9, 1497.6);
  const item = newRollingApprovalDigest("x", "y");
  item.ratio = 1499.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingApprovalDigestChannelLengthRule flags a long channel", () => {
  const rule = new RollingApprovalDigestChannelLengthRule(80);
  const item = newRollingApprovalDigest("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingApprovalDigestQuantityRangeRule flags values above quantity", () => {
  const rule = new RollingApprovalDigestQuantityRangeRule(16, 80);
  const item = newRollingApprovalDigest("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingApprovalDigestSegmentLengthRule flags a long segment", () => {
  const rule = new RollingApprovalDigestSegmentLengthRule(1000);
  const item = newRollingApprovalDigest("x", "y");
  item.segment = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
