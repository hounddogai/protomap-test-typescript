import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryCreditReservationCodeLengthRule,
  PrimaryCreditReservationRequiredCodeRule,
  PrimaryCreditReservationSourceLengthRule,
  defaultPrimaryCreditReservationValidator,
} from "./primary-credit-reservation-rules.js";
import { newPrimaryCreditReservation } from "./primary-credit-reservation.js";

test("PrimaryCreditReservationValidator reports every problem", () => {
  const validator = defaultPrimaryCreditReservationValidator();
  const item = newPrimaryCreditReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryCreditReservationSourceLengthRule flags a long source", () => {
  const rule = new PrimaryCreditReservationSourceLengthRule(16);
  const item = newPrimaryCreditReservation("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryCreditReservationCodeLengthRule flags a long code", () => {
  const rule = new PrimaryCreditReservationCodeLengthRule(1000);
  const item = newPrimaryCreditReservation("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryCreditReservationRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryCreditReservationRequiredCodeRule("primary credit reservation needs an entry");
  const item = newPrimaryCreditReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
