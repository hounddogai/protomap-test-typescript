import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInReservationNameLengthRule,
  DoubleOptInReservationThresholdRangeRule,
  DoubleOptInReservationWeightRangeRule,
  defaultDoubleOptInReservationValidator,
} from "./double-opt-in-reservation-rules.js";
import { newDoubleOptInReservation } from "./double-opt-in-reservation.js";

test("DoubleOptInReservationValidator reports every problem", () => {
  const validator = defaultDoubleOptInReservationValidator();
  const item = newDoubleOptInReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInReservationThresholdRangeRule flags values above threshold", () => {
  const rule = new DoubleOptInReservationThresholdRangeRule(8.1, 4185);
  const item = newDoubleOptInReservation("x", "y");
  item.threshold = 4186.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInReservationNameLengthRule flags a long name", () => {
  const rule = new DoubleOptInReservationNameLengthRule(1000);
  const item = newDoubleOptInReservation("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInReservationWeightRangeRule flags values above weight", () => {
  const rule = new DoubleOptInReservationWeightRangeRule(1.6, 1531.4);
  const item = newDoubleOptInReservation("x", "y");
  item.weight = 1532.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
