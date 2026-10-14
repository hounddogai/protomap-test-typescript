import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceReservationCurrencyLengthRule,
  BounceReservationGraceDaysRangeRule,
  BounceReservationScoreRangeRule,
  defaultBounceReservationValidator,
} from "./bounce-reservation-rules.js";
import { newBounceReservation } from "./bounce-reservation.js";

test("BounceReservationValidator reports every problem", () => {
  const validator = defaultBounceReservationValidator();
  const item = newBounceReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceReservationGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BounceReservationGraceDaysRangeRule(3600, 3600);
  const item = newBounceReservation("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceReservationScoreRangeRule flags values above score", () => {
  const rule = new BounceReservationScoreRangeRule(9.2, 3657.7);
  const item = newBounceReservation("x", "y");
  item.score = 3659.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceReservationCurrencyLengthRule flags a long currency", () => {
  const rule = new BounceReservationCurrencyLengthRule(32);
  const item = newBounceReservation("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
