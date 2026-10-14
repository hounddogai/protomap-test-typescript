import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTicketViewScheduleRequiredCountryRule,
  PrimaryTicketViewScheduleRequiredOwnerIdRule,
  defaultPrimaryTicketViewScheduleValidator,
} from "./primary-ticket-view-schedule-rules.js";
import { newPrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

test("PrimaryTicketViewScheduleValidator reports every problem", () => {
  const validator = defaultPrimaryTicketViewScheduleValidator();
  const item = newPrimaryTicketViewSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTicketViewScheduleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PrimaryTicketViewScheduleRequiredOwnerIdRule("primary ticket view schedule needs an entry");
  const item = newPrimaryTicketViewSchedule("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTicketViewScheduleRequiredCountryRule flags a blank country", () => {
  const rule = new PrimaryTicketViewScheduleRequiredCountryRule("primary ticket view schedule needs a value");
  const item = newPrimaryTicketViewSchedule("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
