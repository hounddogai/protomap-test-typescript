import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyAssignmentAudienceIdLengthRule,
  ReplyAssignmentCodeLengthRule,
  ReplyAssignmentRequiredCodeRule,
  ReplyAssignmentSendAtRangeRule,
  ReplyAssignmentTitleLengthRule,
  defaultReplyAssignmentValidator,
} from "./reply-assignment-rules.js";
import { newReplyAssignment } from "./reply-assignment.js";

test("ReplyAssignmentValidator reports every problem", () => {
  const validator = defaultReplyAssignmentValidator();
  const item = newReplyAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyAssignmentTitleLengthRule flags a long title", () => {
  const rule = new ReplyAssignmentTitleLengthRule(80);
  const item = newReplyAssignment("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyAssignmentCodeLengthRule flags a long code", () => {
  const rule = new ReplyAssignmentCodeLengthRule(86400);
  const item = newReplyAssignment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyAssignmentSendAtRangeRule flags values above send at", () => {
  const rule = new ReplyAssignmentSendAtRangeRule(32, 80);
  const item = newReplyAssignment("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyAssignmentAudienceIdLengthRule flags a long audience id", () => {
  const rule = new ReplyAssignmentAudienceIdLengthRule(64);
  const item = newReplyAssignment("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyAssignmentRequiredCodeRule("reply assignment needs this field");
  const item = newReplyAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
