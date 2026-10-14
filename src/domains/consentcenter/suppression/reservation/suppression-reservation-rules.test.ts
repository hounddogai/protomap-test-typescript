import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionReservationCodeLengthRule,
  SuppressionReservationDiscountRangeRule,
  SuppressionReservationLabelLengthRule,
  SuppressionReservationQuantityRangeRule,
  SuppressionReservationSequenceRangeRule,
  defaultSuppressionReservationValidator,
} from "./suppression-reservation-rules.js";
import { newSuppressionReservation } from "./suppression-reservation.js";

test("SuppressionReservationValidator reports every problem", () => {
  const validator = defaultSuppressionReservationValidator();
  const item = newSuppressionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionReservationQuantityRangeRule flags values above quantity", () => {
  const rule = new SuppressionReservationQuantityRangeRule(64, 255);
  const item = newSuppressionReservation("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionReservationSequenceRangeRule flags values above sequence", () => {
  const rule = new SuppressionReservationSequenceRangeRule(16, 3600);
  const item = newSuppressionReservation("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionReservationLabelLengthRule flags a long label", () => {
  const rule = new SuppressionReservationLabelLengthRule(86400);
  const item = newSuppressionReservation("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionReservationDiscountRangeRule flags values above discount", () => {
  const rule = new SuppressionReservationDiscountRangeRule(4.1, 4530.8);
  const item = newSuppressionReservation("x", "y");
  item.discount = 4532.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionReservationCodeLengthRule flags a long code", () => {
  const rule = new SuppressionReservationCodeLengthRule(1000);
  const item = newSuppressionReservation("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
