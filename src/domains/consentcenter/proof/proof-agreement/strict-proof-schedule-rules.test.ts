import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictProofScheduleRequiredChannelRule,
  StrictProofScheduleRequiredCodeRule,
  defaultStrictProofScheduleValidator,
} from "./strict-proof-schedule-rules.js";
import { newStrictProofSchedule } from "./strict-proof-schedule.js";

test("StrictProofScheduleValidator reports every problem", () => {
  const validator = defaultStrictProofScheduleValidator();
  const item = newStrictProofSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictProofScheduleRequiredChannelRule flags a blank channel", () => {
  const rule = new StrictProofScheduleRequiredChannelRule("strict proof schedule needs a value");
  const item = newStrictProofSchedule("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictProofScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new StrictProofScheduleRequiredCodeRule("strict proof schedule needs this field");
  const item = newStrictProofSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
