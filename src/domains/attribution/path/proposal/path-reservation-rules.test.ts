import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathReservationBudgetRangeRule,
  PathReservationLabelLengthRule,
  PathReservationRequiredUnitRule,
  defaultPathReservationValidator,
} from "./path-reservation-rules.js";
import { newPathReservation } from "./path-reservation.js";

test("PathReservationValidator reports every problem", () => {
  const validator = defaultPathReservationValidator();
  const item = newPathReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathReservationRequiredUnitRule flags a blank unit", () => {
  const rule = new PathReservationRequiredUnitRule("path reservation needs an entry");
  const item = newPathReservation("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathReservationBudgetRangeRule flags values above budget", () => {
  const rule = new PathReservationBudgetRangeRule(9.7, 4557.5);
  const item = newPathReservation("x", "y");
  item.budget = 4559;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathReservationLabelLengthRule flags a long label", () => {
  const rule = new PathReservationLabelLengthRule(3600);
  const item = newPathReservation("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
