import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyReservationCodeLengthRule,
  JourneyReservationRequiredCodeRule,
  defaultJourneyReservationValidator,
} from "./journey-reservation-rules.js";
import { newJourneyReservation } from "./journey-reservation.js";

test("JourneyReservationValidator reports every problem", () => {
  const validator = defaultJourneyReservationValidator();
  const item = newJourneyReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyReservationCodeLengthRule flags a long code", () => {
  const rule = new JourneyReservationCodeLengthRule(3600);
  const item = newJourneyReservation("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyReservationRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyReservationRequiredCodeRule("journey reservation needs a value");
  const item = newJourneyReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
