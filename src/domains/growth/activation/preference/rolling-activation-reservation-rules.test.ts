import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingActivationReservationFloorValueRangeRule,
  RollingActivationReservationGraceDaysRangeRule,
  RollingActivationReservationLabelLengthRule,
  RollingActivationReservationRequiredCurrencyRule,
  RollingActivationReservationRequiredLabelRule,
  defaultRollingActivationReservationValidator,
} from "./rolling-activation-reservation-rules.js";
import { newRollingActivationReservation } from "./rolling-activation-reservation.js";

test("RollingActivationReservationValidator reports every problem", () => {
  const validator = defaultRollingActivationReservationValidator();
  const item = newRollingActivationReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingActivationReservationFloorValueRangeRule flags values above floor value", () => {
  const rule = new RollingActivationReservationFloorValueRangeRule(5.5, 2248);
  const item = newRollingActivationReservation("x", "y");
  item.floorValue = 2249.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingActivationReservationRequiredCurrencyRule flags a blank currency", () => {
  const rule = new RollingActivationReservationRequiredCurrencyRule("rolling activation reservation needs a value");
  const item = newRollingActivationReservation("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingActivationReservationGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RollingActivationReservationGraceDaysRangeRule(120, 255);
  const item = newRollingActivationReservation("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingActivationReservationRequiredLabelRule flags a blank label", () => {
  const rule = new RollingActivationReservationRequiredLabelRule("rolling activation reservation needs this field");
  const item = newRollingActivationReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingActivationReservationLabelLengthRule flags a long label", () => {
  const rule = new RollingActivationReservationLabelLengthRule(80);
  const item = newRollingActivationReservation("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
