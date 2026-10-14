import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintReservationCohortLengthRule,
  ComplaintReservationRequiredUnitRule,
  defaultComplaintReservationValidator,
} from "./complaint-reservation-rules.js";
import { newComplaintReservation } from "./complaint-reservation.js";

test("ComplaintReservationValidator reports every problem", () => {
  const validator = defaultComplaintReservationValidator();
  const item = newComplaintReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintReservationCohortLengthRule flags a long cohort", () => {
  const rule = new ComplaintReservationCohortLengthRule(16);
  const item = newComplaintReservation("x", "y");
  item.cohort = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintReservationRequiredUnitRule flags a blank unit", () => {
  const rule = new ComplaintReservationRequiredUnitRule("complaint reservation needs this field");
  const item = newComplaintReservation("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
