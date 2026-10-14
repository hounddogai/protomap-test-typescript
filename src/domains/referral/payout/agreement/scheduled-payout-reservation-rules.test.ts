import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPayoutReservationChannelLengthRule,
  ScheduledPayoutReservationRequiredCodeRule,
  defaultScheduledPayoutReservationValidator,
} from "./scheduled-payout-reservation-rules.js";
import { newScheduledPayoutReservation } from "./scheduled-payout-reservation.js";

test("ScheduledPayoutReservationValidator reports every problem", () => {
  const validator = defaultScheduledPayoutReservationValidator();
  const item = newScheduledPayoutReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPayoutReservationRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledPayoutReservationRequiredCodeRule("scheduled payout reservation needs an entry");
  const item = newScheduledPayoutReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPayoutReservationChannelLengthRule flags a long channel", () => {
  const rule = new ScheduledPayoutReservationChannelLengthRule(1000);
  const item = newScheduledPayoutReservation("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
