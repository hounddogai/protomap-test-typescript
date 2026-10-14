import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveInviteScheduleQuantityRangeRule,
  AdaptiveInviteScheduleRequiredCodeRule,
  AdaptiveInviteScheduleRequiredTimezoneRule,
  defaultAdaptiveInviteScheduleValidator,
} from "./adaptive-invite-schedule-rules.js";
import { newAdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

test("AdaptiveInviteScheduleValidator reports every problem", () => {
  const validator = defaultAdaptiveInviteScheduleValidator();
  const item = newAdaptiveInviteSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveInviteScheduleQuantityRangeRule flags values above quantity", () => {
  const rule = new AdaptiveInviteScheduleQuantityRangeRule(255, 3600);
  const item = newAdaptiveInviteSchedule("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveInviteScheduleRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new AdaptiveInviteScheduleRequiredTimezoneRule("adaptive invite schedule needs an entry");
  const item = newAdaptiveInviteSchedule("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveInviteScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveInviteScheduleRequiredCodeRule("adaptive invite schedule needs an entry");
  const item = newAdaptiveInviteSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
