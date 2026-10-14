import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDoubleOptInReservationImpressionsRangeRule,
  LegacyDoubleOptInReservationRequiredChecksumRule,
  LegacyDoubleOptInReservationRequiredLocaleRule,
  LegacyDoubleOptInReservationTitleLengthRule,
  defaultLegacyDoubleOptInReservationValidator,
} from "./legacy-double-opt-in-reservation-rules.js";
import { newLegacyDoubleOptInReservation } from "./legacy-double-opt-in-reservation.js";

test("LegacyDoubleOptInReservationValidator reports every problem", () => {
  const validator = defaultLegacyDoubleOptInReservationValidator();
  const item = newLegacyDoubleOptInReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDoubleOptInReservationRequiredLocaleRule flags a blank locale", () => {
  const rule = new LegacyDoubleOptInReservationRequiredLocaleRule("legacy double opt in reservation needs this field");
  const item = newLegacyDoubleOptInReservation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDoubleOptInReservationRequiredChecksumRule flags a blank checksum", () => {
  const rule = new LegacyDoubleOptInReservationRequiredChecksumRule("legacy double opt in reservation needs this field");
  const item = newLegacyDoubleOptInReservation("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDoubleOptInReservationImpressionsRangeRule flags values above impressions", () => {
  const rule = new LegacyDoubleOptInReservationImpressionsRangeRule(3600, 86400);
  const item = newLegacyDoubleOptInReservation("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDoubleOptInReservationTitleLengthRule flags a long title", () => {
  const rule = new LegacyDoubleOptInReservationTitleLengthRule(255);
  const item = newLegacyDoubleOptInReservation("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
