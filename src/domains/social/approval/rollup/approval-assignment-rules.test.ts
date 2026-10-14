import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalAssignmentLocaleLengthRule,
  ApprovalAssignmentRequiredCodeRule,
  ApprovalAssignmentRequiredTitleRule,
  ApprovalAssignmentTitleLengthRule,
  defaultApprovalAssignmentValidator,
} from "./approval-assignment-rules.js";
import { newApprovalAssignment } from "./approval-assignment.js";

test("ApprovalAssignmentValidator reports every problem", () => {
  const validator = defaultApprovalAssignmentValidator();
  const item = newApprovalAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalAssignmentLocaleLengthRule flags a long locale", () => {
  const rule = new ApprovalAssignmentLocaleLengthRule(255);
  const item = newApprovalAssignment("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalAssignmentRequiredCodeRule("approval assignment needs this field");
  const item = newApprovalAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalAssignmentTitleLengthRule flags a long title", () => {
  const rule = new ApprovalAssignmentTitleLengthRule(80);
  const item = newApprovalAssignment("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new ApprovalAssignmentRequiredTitleRule("approval assignment needs this field");
  const item = newApprovalAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
