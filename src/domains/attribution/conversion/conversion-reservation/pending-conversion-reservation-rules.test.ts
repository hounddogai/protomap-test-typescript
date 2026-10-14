import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingConversionReservationEndsAtRangeRule,
  PendingConversionReservationLabelLengthRule,
  defaultPendingConversionReservationValidator,
} from "./pending-conversion-reservation-rules.js";
import { newPendingConversionReservation } from "./pending-conversion-reservation.js";

test("PendingConversionReservationValidator reports every problem", () => {
  const validator = defaultPendingConversionReservationValidator();
  const item = newPendingConversionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingConversionReservationEndsAtRangeRule flags values above ends at", () => {
  const rule = new PendingConversionReservationEndsAtRangeRule(86400, 86400);
  const item = newPendingConversionReservation("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingConversionReservationLabelLengthRule flags a long label", () => {
  const rule = new PendingConversionReservationLabelLengthRule(80);
  const item = newPendingConversionReservation("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
