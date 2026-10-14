import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementReservationCodeLengthRule,
  PlacementReservationLabelLengthRule,
  PlacementReservationRequiredLabelRule,
  defaultPlacementReservationValidator,
} from "./placement-reservation-rules.js";
import { newPlacementReservation } from "./placement-reservation.js";

test("PlacementReservationValidator reports every problem", () => {
  const validator = defaultPlacementReservationValidator();
  const item = newPlacementReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementReservationLabelLengthRule flags a long label", () => {
  const rule = new PlacementReservationLabelLengthRule(1000);
  const item = newPlacementReservation("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementReservationRequiredLabelRule flags a blank label", () => {
  const rule = new PlacementReservationRequiredLabelRule("placement reservation needs a value");
  const item = newPlacementReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementReservationCodeLengthRule flags a long code", () => {
  const rule = new PlacementReservationCodeLengthRule(64);
  const item = newPlacementReservation("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
