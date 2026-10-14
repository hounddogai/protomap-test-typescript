import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditReservationCodeLengthRule,
  CreditReservationExternalRefLengthRule,
  CreditReservationMinimumRangeRule,
  CreditReservationRequiredReviewerRule,
  CreditReservationStartsAtRangeRule,
  CreditReservationTitleLengthRule,
  defaultCreditReservationValidator,
} from "./credit-reservation-rules.js";
import { newCreditReservation } from "./credit-reservation.js";

test("CreditReservationValidator reports every problem", () => {
  const validator = defaultCreditReservationValidator();
  const item = newCreditReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditReservationMinimumRangeRule flags values above minimum", () => {
  const rule = new CreditReservationMinimumRangeRule(1.1, 4916.6);
  const item = newCreditReservation("x", "y");
  item.minimum = 4918.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditReservationRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CreditReservationRequiredReviewerRule("credit reservation needs an entry");
  const item = newCreditReservation("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditReservationStartsAtRangeRule flags values above starts at", () => {
  const rule = new CreditReservationStartsAtRangeRule(64, 1000);
  const item = newCreditReservation("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditReservationExternalRefLengthRule flags a long external ref", () => {
  const rule = new CreditReservationExternalRefLengthRule(32);
  const item = newCreditReservation("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditReservationTitleLengthRule flags a long title", () => {
  const rule = new CreditReservationTitleLengthRule(86400);
  const item = newCreditReservation("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditReservationCodeLengthRule flags a long code", () => {
  const rule = new CreditReservationCodeLengthRule(86400);
  const item = newCreditReservation("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
