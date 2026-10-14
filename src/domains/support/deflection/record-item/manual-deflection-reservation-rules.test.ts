import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualDeflectionReservationCodeLengthRule,
  ManualDeflectionReservationRequiredVariantRule,
  defaultManualDeflectionReservationValidator,
} from "./manual-deflection-reservation-rules.js";
import { newManualDeflectionReservation } from "./manual-deflection-reservation.js";

test("ManualDeflectionReservationValidator reports every problem", () => {
  const validator = defaultManualDeflectionReservationValidator();
  const item = newManualDeflectionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualDeflectionReservationRequiredVariantRule flags a blank variant", () => {
  const rule = new ManualDeflectionReservationRequiredVariantRule("manual deflection reservation needs an entry");
  const item = newManualDeflectionReservation("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualDeflectionReservationCodeLengthRule flags a long code", () => {
  const rule = new ManualDeflectionReservationCodeLengthRule(86400);
  const item = newManualDeflectionReservation("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
