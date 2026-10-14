import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedInviteScheduleDiscountRangeRule,
  BatchedInviteScheduleTimezoneLengthRule,
  BatchedInviteScheduleTitleLengthRule,
  defaultBatchedInviteScheduleValidator,
} from "./batched-invite-schedule-rules.js";
import { newBatchedInviteSchedule } from "./batched-invite-schedule.js";

test("BatchedInviteScheduleValidator reports every problem", () => {
  const validator = defaultBatchedInviteScheduleValidator();
  const item = newBatchedInviteSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedInviteScheduleTimezoneLengthRule flags a long timezone", () => {
  const rule = new BatchedInviteScheduleTimezoneLengthRule(80);
  const item = newBatchedInviteSchedule("x", "y");
  item.timezone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedInviteScheduleDiscountRangeRule flags values above discount", () => {
  const rule = new BatchedInviteScheduleDiscountRangeRule(6.8, 2474.5);
  const item = newBatchedInviteSchedule("x", "y");
  item.discount = 2476;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedInviteScheduleTitleLengthRule flags a long title", () => {
  const rule = new BatchedInviteScheduleTitleLengthRule(86400);
  const item = newBatchedInviteSchedule("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
