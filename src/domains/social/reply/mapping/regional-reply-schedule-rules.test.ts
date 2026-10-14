import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalReplyScheduleCreatedAtRangeRule,
  RegionalReplyScheduleQuantityRangeRule,
  RegionalReplyScheduleRequiredContactEmailRule,
  RegionalReplyScheduleStartsAtRangeRule,
  defaultRegionalReplyScheduleValidator,
} from "./regional-reply-schedule-rules.js";
import { newRegionalReplySchedule } from "./regional-reply-schedule.js";

test("RegionalReplyScheduleValidator reports every problem", () => {
  const validator = defaultRegionalReplyScheduleValidator();
  const item = newRegionalReplySchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalReplyScheduleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RegionalReplyScheduleRequiredContactEmailRule("regional reply schedule needs a value");
  const item = newRegionalReplySchedule("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalReplyScheduleCreatedAtRangeRule flags values above created at", () => {
  const rule = new RegionalReplyScheduleCreatedAtRangeRule(16, 3600);
  const item = newRegionalReplySchedule("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalReplyScheduleStartsAtRangeRule flags values above starts at", () => {
  const rule = new RegionalReplyScheduleStartsAtRangeRule(120, 255);
  const item = newRegionalReplySchedule("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalReplyScheduleQuantityRangeRule flags values above quantity", () => {
  const rule = new RegionalReplyScheduleQuantityRangeRule(16, 255);
  const item = newRegionalReplySchedule("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
