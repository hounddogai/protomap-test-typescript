import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteReservationLimitRangeRule,
  InviteReservationRequiredExternalRefRule,
  InviteReservationRequiredTitleRule,
  defaultInviteReservationValidator,
} from "./invite-reservation-rules.js";
import { newInviteReservation } from "./invite-reservation.js";

test("InviteReservationValidator reports every problem", () => {
  const validator = defaultInviteReservationValidator();
  const item = newInviteReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteReservationRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new InviteReservationRequiredExternalRefRule("invite reservation needs a value");
  const item = newInviteReservation("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteReservationRequiredTitleRule flags a blank title", () => {
  const rule = new InviteReservationRequiredTitleRule("invite reservation needs an entry");
  const item = newInviteReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteReservationLimitRangeRule flags values above limit", () => {
  const rule = new InviteReservationLimitRangeRule(255, 86400);
  const item = newInviteReservation("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
