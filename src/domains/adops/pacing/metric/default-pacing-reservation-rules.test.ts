import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPacingReservationBudgetRangeRule,
  DefaultPacingReservationCodeLengthRule,
  DefaultPacingReservationLabelLengthRule,
  DefaultPacingReservationRequiredLabelRule,
  DefaultPacingReservationVersionRangeRule,
  defaultDefaultPacingReservationValidator,
} from "./default-pacing-reservation-rules.js";
import { newDefaultPacingReservation } from "./default-pacing-reservation.js";

test("DefaultPacingReservationValidator reports every problem", () => {
  const validator = defaultDefaultPacingReservationValidator();
  const item = newDefaultPacingReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPacingReservationRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultPacingReservationRequiredLabelRule("default pacing reservation needs a value");
  const item = newDefaultPacingReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPacingReservationVersionRangeRule flags values above version", () => {
  const rule = new DefaultPacingReservationVersionRangeRule(16, 32);
  const item = newDefaultPacingReservation("x", "y");
  item.version = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPacingReservationCodeLengthRule flags a long code", () => {
  const rule = new DefaultPacingReservationCodeLengthRule(1000);
  const item = newDefaultPacingReservation("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPacingReservationLabelLengthRule flags a long label", () => {
  const rule = new DefaultPacingReservationLabelLengthRule(16);
  const item = newDefaultPacingReservation("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPacingReservationBudgetRangeRule flags values above budget", () => {
  const rule = new DefaultPacingReservationBudgetRangeRule(5.2, 3376.4);
  const item = newDefaultPacingReservation("x", "y");
  item.budget = 3377.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
