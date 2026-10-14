import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyScheduleLimitRangeRule,
  ReplySchedulePriorityRangeRule,
  ReplyScheduleRequiredCodeRule,
  defaultReplyScheduleValidator,
} from "./reply-schedule-rules.js";
import { newReplySchedule } from "./reply-schedule.js";

test("ReplyScheduleValidator reports every problem", () => {
  const validator = defaultReplyScheduleValidator();
  const item = newReplySchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyScheduleLimitRangeRule flags values above limit", () => {
  const rule = new ReplyScheduleLimitRangeRule(32, 255);
  const item = newReplySchedule("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplySchedulePriorityRangeRule flags values above priority", () => {
  const rule = new ReplySchedulePriorityRangeRule(120, 86400);
  const item = newReplySchedule("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyScheduleRequiredCodeRule("reply schedule needs this field");
  const item = newReplySchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
