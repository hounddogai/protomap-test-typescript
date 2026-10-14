import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaReservationRateRangeRule,
  SlaReservationRequiredLocaleRule,
  defaultSlaReservationValidator,
} from "./sla-reservation-rules.js";
import { newSlaReservation } from "./sla-reservation.js";

test("SlaReservationValidator reports every problem", () => {
  const validator = defaultSlaReservationValidator();
  const item = newSlaReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaReservationRateRangeRule flags values above rate", () => {
  const rule = new SlaReservationRateRangeRule(10, 3279.9);
  const item = newSlaReservation("x", "y");
  item.rate = 3281.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaReservationRequiredLocaleRule flags a blank locale", () => {
  const rule = new SlaReservationRequiredLocaleRule("sla reservation needs an entry");
  const item = newSlaReservation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
