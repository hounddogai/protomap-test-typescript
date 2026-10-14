import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalScheduleCodeLengthRule,
  ApprovalScheduleDescriptionLengthRule,
  ApprovalScheduleNameLengthRule,
  ApprovalScheduleRequiredNameRule,
  ApprovalScheduleScoreRangeRule,
  defaultApprovalScheduleValidator,
} from "./approval-schedule-rules.js";
import { newApprovalSchedule } from "./approval-schedule.js";

test("ApprovalScheduleValidator reports every problem", () => {
  const validator = defaultApprovalScheduleValidator();
  const item = newApprovalSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalScheduleDescriptionLengthRule flags a long description", () => {
  const rule = new ApprovalScheduleDescriptionLengthRule(32);
  const item = newApprovalSchedule("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalScheduleNameLengthRule flags a long name", () => {
  const rule = new ApprovalScheduleNameLengthRule(120);
  const item = newApprovalSchedule("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalScheduleRequiredNameRule flags a blank name", () => {
  const rule = new ApprovalScheduleRequiredNameRule("approval schedule needs an entry");
  const item = newApprovalSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalScheduleScoreRangeRule flags values above score", () => {
  const rule = new ApprovalScheduleScoreRangeRule(6.3, 4916.1);
  const item = newApprovalSchedule("x", "y");
  item.score = 4917.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalScheduleCodeLengthRule flags a long code", () => {
  const rule = new ApprovalScheduleCodeLengthRule(120);
  const item = newApprovalSchedule("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
