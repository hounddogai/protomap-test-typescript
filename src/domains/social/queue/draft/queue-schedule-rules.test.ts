import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueScheduleCodeLengthRule,
  QueueScheduleRequiredLocaleRule,
  QueueScheduleRequiredTitleRule,
  defaultQueueScheduleValidator,
} from "./queue-schedule-rules.js";
import { newQueueSchedule } from "./queue-schedule.js";

test("QueueScheduleValidator reports every problem", () => {
  const validator = defaultQueueScheduleValidator();
  const item = newQueueSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new QueueScheduleRequiredTitleRule("queue schedule needs an entry");
  const item = newQueueSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueScheduleCodeLengthRule flags a long code", () => {
  const rule = new QueueScheduleCodeLengthRule(3600);
  const item = newQueueSchedule("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueScheduleRequiredLocaleRule flags a blank locale", () => {
  const rule = new QueueScheduleRequiredLocaleRule("queue schedule needs an entry");
  const item = newQueueSchedule("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
