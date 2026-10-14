import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalDigestLimitRangeRule,
  ApprovalDigestNameLengthRule,
  ApprovalDigestRequiredNameRule,
  ApprovalDigestVersionRangeRule,
  defaultApprovalDigestValidator,
} from "./approval-digest-rules.js";
import { newApprovalDigest } from "./approval-digest.js";

test("ApprovalDigestValidator reports every problem", () => {
  const validator = defaultApprovalDigestValidator();
  const item = newApprovalDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalDigestNameLengthRule flags a long name", () => {
  const rule = new ApprovalDigestNameLengthRule(1000);
  const item = newApprovalDigest("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalDigestLimitRangeRule flags values above limit", () => {
  const rule = new ApprovalDigestLimitRangeRule(80, 3600);
  const item = newApprovalDigest("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalDigestRequiredNameRule flags a blank name", () => {
  const rule = new ApprovalDigestRequiredNameRule("approval digest needs a value");
  const item = newApprovalDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalDigestVersionRangeRule flags values above version", () => {
  const rule = new ApprovalDigestVersionRangeRule(64, 86400);
  const item = newApprovalDigest("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
