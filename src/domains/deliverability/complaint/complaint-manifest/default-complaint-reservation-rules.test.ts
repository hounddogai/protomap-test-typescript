import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultComplaintReservationBudgetRangeRule,
  DefaultComplaintReservationCodeLengthRule,
  DefaultComplaintReservationDiscountRangeRule,
  DefaultComplaintReservationRequiredCodeRule,
  DefaultComplaintReservationRequiredTitleRule,
  defaultDefaultComplaintReservationValidator,
} from "./default-complaint-reservation-rules.js";
import { newDefaultComplaintReservation } from "./default-complaint-reservation.js";

test("DefaultComplaintReservationValidator reports every problem", () => {
  const validator = defaultDefaultComplaintReservationValidator();
  const item = newDefaultComplaintReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultComplaintReservationBudgetRangeRule flags values above budget", () => {
  const rule = new DefaultComplaintReservationBudgetRangeRule(2.1, 228.1);
  const item = newDefaultComplaintReservation("x", "y");
  item.budget = 229.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultComplaintReservationRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultComplaintReservationRequiredCodeRule("default complaint reservation needs this field");
  const item = newDefaultComplaintReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultComplaintReservationRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultComplaintReservationRequiredTitleRule("default complaint reservation needs this field");
  const item = newDefaultComplaintReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultComplaintReservationDiscountRangeRule flags values above discount", () => {
  const rule = new DefaultComplaintReservationDiscountRangeRule(8.7, 549.6);
  const item = newDefaultComplaintReservation("x", "y");
  item.discount = 551.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultComplaintReservationCodeLengthRule flags a long code", () => {
  const rule = new DefaultComplaintReservationCodeLengthRule(3600);
  const item = newDefaultComplaintReservation("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
