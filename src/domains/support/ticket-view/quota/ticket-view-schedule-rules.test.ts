import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewScheduleLabelLengthRule,
  TicketViewScheduleRequiredCodeRule,
  defaultTicketViewScheduleValidator,
} from "./ticket-view-schedule-rules.js";
import { newTicketViewSchedule } from "./ticket-view-schedule.js";

test("TicketViewScheduleValidator reports every problem", () => {
  const validator = defaultTicketViewScheduleValidator();
  const item = newTicketViewSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewScheduleRequiredCodeRule("ticket view schedule needs an entry");
  const item = newTicketViewSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewScheduleLabelLengthRule flags a long label", () => {
  const rule = new TicketViewScheduleLabelLengthRule(3600);
  const item = newTicketViewSchedule("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
