import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteScheduleCapacityRangeRule,
  InviteScheduleDiscountRangeRule,
  InviteScheduleRatioRangeRule,
  InviteScheduleRetriesRangeRule,
  defaultInviteScheduleValidator,
} from "./invite-schedule-rules.js";
import { newInviteSchedule } from "./invite-schedule.js";

test("InviteScheduleValidator reports every problem", () => {
  const validator = defaultInviteScheduleValidator();
  const item = newInviteSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteScheduleDiscountRangeRule flags values above discount", () => {
  const rule = new InviteScheduleDiscountRangeRule(1.7, 4291.4);
  const item = newInviteSchedule("x", "y");
  item.discount = 4292.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteScheduleRetriesRangeRule flags values above retries", () => {
  const rule = new InviteScheduleRetriesRangeRule(64, 255);
  const item = newInviteSchedule("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteScheduleRatioRangeRule flags values above ratio", () => {
  const rule = new InviteScheduleRatioRangeRule(3.7, 4094.6);
  const item = newInviteSchedule("x", "y");
  item.ratio = 4096.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteScheduleCapacityRangeRule flags values above capacity", () => {
  const rule = new InviteScheduleCapacityRangeRule(16, 64);
  const item = newInviteSchedule("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
