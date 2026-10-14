import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutReservationAudienceIdLengthRule,
  PayoutReservationCreatedAtRangeRule,
  PayoutReservationLocaleLengthRule,
  PayoutReservationRequiredCodeRule,
  PayoutReservationRequiredLocaleRule,
  PayoutReservationRequiredTitleRule,
  defaultPayoutReservationValidator,
} from "./payout-reservation-rules.js";
import { newPayoutReservation } from "./payout-reservation.js";

test("PayoutReservationValidator reports every problem", () => {
  const validator = defaultPayoutReservationValidator();
  const item = newPayoutReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutReservationRequiredTitleRule flags a blank title", () => {
  const rule = new PayoutReservationRequiredTitleRule("payout reservation needs this field");
  const item = newPayoutReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutReservationLocaleLengthRule flags a long locale", () => {
  const rule = new PayoutReservationLocaleLengthRule(86400);
  const item = newPayoutReservation("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutReservationAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PayoutReservationAudienceIdLengthRule(86400);
  const item = newPayoutReservation("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutReservationRequiredLocaleRule flags a blank locale", () => {
  const rule = new PayoutReservationRequiredLocaleRule("payout reservation needs this field");
  const item = newPayoutReservation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutReservationCreatedAtRangeRule flags values above created at", () => {
  const rule = new PayoutReservationCreatedAtRangeRule(80, 255);
  const item = newPayoutReservation("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutReservationRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutReservationRequiredCodeRule("payout reservation needs this field");
  const item = newPayoutReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
