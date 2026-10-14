import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPayoutReservationCodeLengthRule,
  LegacyPayoutReservationConversionRateRangeRule,
  LegacyPayoutReservationNameLengthRule,
  LegacyPayoutReservationRequiredCodeRule,
  LegacyPayoutReservationRequiredNameRule,
  defaultLegacyPayoutReservationValidator,
} from "./legacy-payout-reservation-rules.js";
import { newLegacyPayoutReservation } from "./legacy-payout-reservation.js";

test("LegacyPayoutReservationValidator reports every problem", () => {
  const validator = defaultLegacyPayoutReservationValidator();
  const item = newLegacyPayoutReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPayoutReservationRequiredNameRule flags a blank name", () => {
  const rule = new LegacyPayoutReservationRequiredNameRule("legacy payout reservation needs a value");
  const item = newLegacyPayoutReservation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyPayoutReservationCodeLengthRule flags a long code", () => {
  const rule = new LegacyPayoutReservationCodeLengthRule(32);
  const item = newLegacyPayoutReservation("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutReservationConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LegacyPayoutReservationConversionRateRangeRule(2.1, 3975.1);
  const item = newLegacyPayoutReservation("x", "y");
  item.conversionRate = 3976.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPayoutReservationNameLengthRule flags a long name", () => {
  const rule = new LegacyPayoutReservationNameLengthRule(3600);
  const item = newLegacyPayoutReservation("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPayoutReservationRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyPayoutReservationRequiredCodeRule("legacy payout reservation needs an entry");
  const item = newLegacyPayoutReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
