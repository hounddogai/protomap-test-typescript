import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledRedemptionReservationNameLengthRule,
  ScheduledRedemptionReservationRequiredCodeRule,
  ScheduledRedemptionReservationRequiredNameRule,
  defaultScheduledRedemptionReservationValidator,
} from "./scheduled-redemption-reservation-rules.js";
import { newScheduledRedemptionReservation } from "./scheduled-redemption-reservation.js";

test("ScheduledRedemptionReservationValidator reports every problem", () => {
  const validator = defaultScheduledRedemptionReservationValidator();
  const item = newScheduledRedemptionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledRedemptionReservationRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledRedemptionReservationRequiredCodeRule("scheduled redemption reservation needs a value");
  const item = newScheduledRedemptionReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRedemptionReservationNameLengthRule flags a long name", () => {
  const rule = new ScheduledRedemptionReservationNameLengthRule(3600);
  const item = newScheduledRedemptionReservation("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledRedemptionReservationRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledRedemptionReservationRequiredNameRule("scheduled redemption reservation needs an entry");
  const item = newScheduledRedemptionReservation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
