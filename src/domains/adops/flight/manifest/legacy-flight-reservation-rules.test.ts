import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFlightReservationCodeLengthRule,
  LegacyFlightReservationExpiresAtRangeRule,
  LegacyFlightReservationGraceDaysRangeRule,
  LegacyFlightReservationRequiredCodeRule,
  LegacyFlightReservationRequiredLabelRule,
  LegacyFlightReservationUnitLengthRule,
  defaultLegacyFlightReservationValidator,
} from "./legacy-flight-reservation-rules.js";
import { newLegacyFlightReservation } from "./legacy-flight-reservation.js";

test("LegacyFlightReservationValidator reports every problem", () => {
  const validator = defaultLegacyFlightReservationValidator();
  const item = newLegacyFlightReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFlightReservationCodeLengthRule flags a long code", () => {
  const rule = new LegacyFlightReservationCodeLengthRule(16);
  const item = newLegacyFlightReservation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFlightReservationGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LegacyFlightReservationGraceDaysRangeRule(64, 120);
  const item = newLegacyFlightReservation("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyFlightReservationUnitLengthRule flags a long unit", () => {
  const rule = new LegacyFlightReservationUnitLengthRule(3600);
  const item = newLegacyFlightReservation("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFlightReservationRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyFlightReservationRequiredLabelRule("legacy flight reservation needs an entry");
  const item = newLegacyFlightReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFlightReservationExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LegacyFlightReservationExpiresAtRangeRule(120, 255);
  const item = newLegacyFlightReservation("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyFlightReservationRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyFlightReservationRequiredCodeRule("legacy flight reservation needs an entry");
  const item = newLegacyFlightReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
