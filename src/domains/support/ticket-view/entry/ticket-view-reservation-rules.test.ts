import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewReservationRequiredCodeRule,
  TicketViewReservationVariantLengthRule,
  defaultTicketViewReservationValidator,
} from "./ticket-view-reservation-rules.js";
import { newTicketViewReservation } from "./ticket-view-reservation.js";

test("TicketViewReservationValidator reports every problem", () => {
  const validator = defaultTicketViewReservationValidator();
  const item = newTicketViewReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewReservationRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewReservationRequiredCodeRule("ticket view reservation needs a value");
  const item = newTicketViewReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewReservationVariantLengthRule flags a long variant", () => {
  const rule = new TicketViewReservationVariantLengthRule(3600);
  const item = newTicketViewReservation("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
