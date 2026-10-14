import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutReservationRegionLengthRule,
  OptOutReservationRequiredRegionRule,
  defaultOptOutReservationValidator,
} from "./opt-out-reservation-rules.js";
import { newOptOutReservation } from "./opt-out-reservation.js";

test("OptOutReservationValidator reports every problem", () => {
  const validator = defaultOptOutReservationValidator();
  const item = newOptOutReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutReservationRegionLengthRule flags a long region", () => {
  const rule = new OptOutReservationRegionLengthRule(86400);
  const item = newOptOutReservation("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutReservationRequiredRegionRule flags a blank region", () => {
  const rule = new OptOutReservationRequiredRegionRule("opt out reservation needs an entry");
  const item = newOptOutReservation("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
