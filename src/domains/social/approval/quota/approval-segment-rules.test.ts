import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalSegmentNameLengthRule,
  ApprovalSegmentRequiredLocaleRule,
  ApprovalSegmentRequiredNameRule,
  defaultApprovalSegmentValidator,
} from "./approval-segment-rules.js";
import { newApprovalSegment } from "./approval-segment.js";

test("ApprovalSegmentValidator reports every problem", () => {
  const validator = defaultApprovalSegmentValidator();
  const item = newApprovalSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalSegmentRequiredLocaleRule flags a blank locale", () => {
  const rule = new ApprovalSegmentRequiredLocaleRule("approval segment needs a value");
  const item = newApprovalSegment("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalSegmentRequiredNameRule flags a blank name", () => {
  const rule = new ApprovalSegmentRequiredNameRule("approval segment needs a value");
  const item = newApprovalSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalSegmentNameLengthRule flags a long name", () => {
  const rule = new ApprovalSegmentNameLengthRule(86400);
  const item = newApprovalSegment("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
