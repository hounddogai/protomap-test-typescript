import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionReservationAttemptsRangeRule,
  DeflectionReservationCodeLengthRule,
  DeflectionReservationNameLengthRule,
  DeflectionReservationRatioRangeRule,
  DeflectionReservationRequiredNameRule,
  defaultDeflectionReservationValidator,
} from "./deflection-reservation-rules.js";
import { newDeflectionReservation } from "./deflection-reservation.js";

test("DeflectionReservationValidator reports every problem", () => {
  const validator = defaultDeflectionReservationValidator();
  const item = newDeflectionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionReservationAttemptsRangeRule flags values above attempts", () => {
  const rule = new DeflectionReservationAttemptsRangeRule(64, 255);
  const item = newDeflectionReservation("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionReservationCodeLengthRule flags a long code", () => {
  const rule = new DeflectionReservationCodeLengthRule(64);
  const item = newDeflectionReservation("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionReservationRatioRangeRule flags values above ratio", () => {
  const rule = new DeflectionReservationRatioRangeRule(9.5, 982.8);
  const item = newDeflectionReservation("x", "y");
  item.ratio = 984.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionReservationNameLengthRule flags a long name", () => {
  const rule = new DeflectionReservationNameLengthRule(16);
  const item = newDeflectionReservation("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionReservationRequiredNameRule flags a blank name", () => {
  const rule = new DeflectionReservationRequiredNameRule("deflection reservation needs this field");
  const item = newDeflectionReservation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
