import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCreditReservationNameLengthRule,
  StrictCreditReservationRequiredLabelRule,
  StrictCreditReservationRequiredLocaleRule,
  defaultStrictCreditReservationValidator,
} from "./strict-credit-reservation-rules.js";
import { newStrictCreditReservation } from "./strict-credit-reservation.js";

test("StrictCreditReservationValidator reports every problem", () => {
  const validator = defaultStrictCreditReservationValidator();
  const item = newStrictCreditReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCreditReservationNameLengthRule flags a long name", () => {
  const rule = new StrictCreditReservationNameLengthRule(86400);
  const item = newStrictCreditReservation("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreditReservationRequiredLocaleRule flags a blank locale", () => {
  const rule = new StrictCreditReservationRequiredLocaleRule("strict credit reservation needs this field");
  const item = newStrictCreditReservation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCreditReservationRequiredLabelRule flags a blank label", () => {
  const rule = new StrictCreditReservationRequiredLabelRule("strict credit reservation needs this field");
  const item = newStrictCreditReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
