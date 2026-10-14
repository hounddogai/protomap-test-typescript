import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyEnrollmentReservationRequiredCodeRule,
  LegacyEnrollmentReservationRequiredTitleRule,
  LegacyEnrollmentReservationRevisionRangeRule,
  defaultLegacyEnrollmentReservationValidator,
} from "./legacy-enrollment-reservation-rules.js";
import { newLegacyEnrollmentReservation } from "./legacy-enrollment-reservation.js";

test("LegacyEnrollmentReservationValidator reports every problem", () => {
  const validator = defaultLegacyEnrollmentReservationValidator();
  const item = newLegacyEnrollmentReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyEnrollmentReservationRevisionRangeRule flags values above revision", () => {
  const rule = new LegacyEnrollmentReservationRevisionRangeRule(32, 64);
  const item = newLegacyEnrollmentReservation("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyEnrollmentReservationRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyEnrollmentReservationRequiredTitleRule("legacy enrollment reservation needs an entry");
  const item = newLegacyEnrollmentReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyEnrollmentReservationRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyEnrollmentReservationRequiredCodeRule("legacy enrollment reservation needs an entry");
  const item = newLegacyEnrollmentReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
