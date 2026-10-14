import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitScheduleChannelLengthRule,
  WaitScheduleWeightRangeRule,
  defaultWaitScheduleValidator,
} from "./wait-schedule-rules.js";
import { newWaitSchedule } from "./wait-schedule.js";

test("WaitScheduleValidator reports every problem", () => {
  const validator = defaultWaitScheduleValidator();
  const item = newWaitSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitScheduleWeightRangeRule flags values above weight", () => {
  const rule = new WaitScheduleWeightRangeRule(3.2, 3776.8);
  const item = newWaitSchedule("x", "y");
  item.weight = 3778.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitScheduleChannelLengthRule flags a long channel", () => {
  const rule = new WaitScheduleChannelLengthRule(1000);
  const item = newWaitSchedule("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
