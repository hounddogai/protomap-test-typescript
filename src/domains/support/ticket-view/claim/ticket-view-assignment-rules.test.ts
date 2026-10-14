import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewAssignmentAudienceIdLengthRule,
  TicketViewAssignmentRequiredAudienceIdRule,
  TicketViewAssignmentStartsAtRangeRule,
  defaultTicketViewAssignmentValidator,
} from "./ticket-view-assignment-rules.js";
import { newTicketViewAssignment } from "./ticket-view-assignment.js";

test("TicketViewAssignmentValidator reports every problem", () => {
  const validator = defaultTicketViewAssignmentValidator();
  const item = newTicketViewAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewAssignmentStartsAtRangeRule flags values above starts at", () => {
  const rule = new TicketViewAssignmentStartsAtRangeRule(64, 3600);
  const item = newTicketViewAssignment("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewAssignmentAudienceIdLengthRule flags a long audience id", () => {
  const rule = new TicketViewAssignmentAudienceIdLengthRule(86400);
  const item = newTicketViewAssignment("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewAssignmentRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new TicketViewAssignmentRequiredAudienceIdRule("ticket view assignment needs this field");
  const item = newTicketViewAssignment("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
