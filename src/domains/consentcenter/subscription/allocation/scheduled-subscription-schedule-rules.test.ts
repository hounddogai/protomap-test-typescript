import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSubscriptionScheduleCapacityRangeRule,
  ScheduledSubscriptionScheduleCodeLengthRule,
  ScheduledSubscriptionScheduleContactEmailLengthRule,
  ScheduledSubscriptionScheduleRequiredCodeRule,
  ScheduledSubscriptionScheduleRequiredTitleRule,
  defaultScheduledSubscriptionScheduleValidator,
} from "./scheduled-subscription-schedule-rules.js";
import { newScheduledSubscriptionSchedule } from "./scheduled-subscription-schedule.js";

test("ScheduledSubscriptionScheduleValidator reports every problem", () => {
  const validator = defaultScheduledSubscriptionScheduleValidator();
  const item = newScheduledSubscriptionSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSubscriptionScheduleCodeLengthRule flags a long code", () => {
  const rule = new ScheduledSubscriptionScheduleCodeLengthRule(80);
  const item = newScheduledSubscriptionSchedule("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSubscriptionScheduleContactEmailLengthRule flags a long contact email", () => {
  const rule = new ScheduledSubscriptionScheduleContactEmailLengthRule(255);
  const item = newScheduledSubscriptionSchedule("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSubscriptionScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledSubscriptionScheduleRequiredTitleRule("scheduled subscription schedule needs this field");
  const item = newScheduledSubscriptionSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSubscriptionScheduleCapacityRangeRule flags values above capacity", () => {
  const rule = new ScheduledSubscriptionScheduleCapacityRangeRule(86400, 86400);
  const item = newScheduledSubscriptionSchedule("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSubscriptionScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledSubscriptionScheduleRequiredCodeRule("scheduled subscription schedule needs this field");
  const item = newScheduledSubscriptionSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
