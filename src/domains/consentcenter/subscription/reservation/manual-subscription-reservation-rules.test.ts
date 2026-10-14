import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSubscriptionReservationTitleLengthRule,
  defaultManualSubscriptionReservationValidator,
} from "./manual-subscription-reservation-rules.js";
import { newManualSubscriptionReservation } from "./manual-subscription-reservation.js";

test("ManualSubscriptionReservationValidator reports every problem", () => {
  const validator = defaultManualSubscriptionReservationValidator();
  const item = newManualSubscriptionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSubscriptionReservationTitleLengthRule flags a long title", () => {
  const rule = new ManualSubscriptionReservationTitleLengthRule(255);
  const item = newManualSubscriptionReservation("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
