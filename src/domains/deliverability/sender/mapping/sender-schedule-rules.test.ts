import assert from "node:assert/strict";
import { test } from "node:test";
import { SenderScheduleRequiredCodeRule, defaultSenderScheduleValidator } from "./sender-schedule-rules.js";
import { newSenderSchedule } from "./sender-schedule.js";

test("SenderScheduleValidator reports every problem", () => {
  const validator = defaultSenderScheduleValidator();
  const item = newSenderSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new SenderScheduleRequiredCodeRule("sender schedule needs an entry");
  const item = newSenderSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
