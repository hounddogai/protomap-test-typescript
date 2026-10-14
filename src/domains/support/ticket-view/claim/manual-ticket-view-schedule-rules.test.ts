import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTicketViewScheduleRequiredVariantRule,
  ManualTicketViewScheduleStartsAtRangeRule,
  ManualTicketViewScheduleVariantLengthRule,
  defaultManualTicketViewScheduleValidator,
} from "./manual-ticket-view-schedule-rules.js";
import { newManualTicketViewSchedule } from "./manual-ticket-view-schedule.js";

test("ManualTicketViewScheduleValidator reports every problem", () => {
  const validator = defaultManualTicketViewScheduleValidator();
  const item = newManualTicketViewSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTicketViewScheduleVariantLengthRule flags a long variant", () => {
  const rule = new ManualTicketViewScheduleVariantLengthRule(80);
  const item = newManualTicketViewSchedule("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTicketViewScheduleRequiredVariantRule flags a blank variant", () => {
  const rule = new ManualTicketViewScheduleRequiredVariantRule("manual ticket view schedule needs this field");
  const item = newManualTicketViewSchedule("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTicketViewScheduleStartsAtRangeRule flags values above starts at", () => {
  const rule = new ManualTicketViewScheduleStartsAtRangeRule(32, 255);
  const item = newManualTicketViewSchedule("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
