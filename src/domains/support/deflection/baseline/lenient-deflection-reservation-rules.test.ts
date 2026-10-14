import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDeflectionReservationCategoryLengthRule,
  LenientDeflectionReservationRequiredCategoryRule,
  defaultLenientDeflectionReservationValidator,
} from "./lenient-deflection-reservation-rules.js";
import { newLenientDeflectionReservation } from "./lenient-deflection-reservation.js";

test("LenientDeflectionReservationValidator reports every problem", () => {
  const validator = defaultLenientDeflectionReservationValidator();
  const item = newLenientDeflectionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDeflectionReservationRequiredCategoryRule flags a blank category", () => {
  const rule = new LenientDeflectionReservationRequiredCategoryRule("lenient deflection reservation needs this field");
  const item = newLenientDeflectionReservation("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDeflectionReservationCategoryLengthRule flags a long category", () => {
  const rule = new LenientDeflectionReservationCategoryLengthRule(64);
  const item = newLenientDeflectionReservation("x", "y");
  item.category = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
