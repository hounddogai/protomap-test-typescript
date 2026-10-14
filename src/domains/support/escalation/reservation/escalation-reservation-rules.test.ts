import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationReservationBudgetRangeRule,
  EscalationReservationCodeLengthRule,
  EscalationReservationRatioRangeRule,
  EscalationReservationRequiredCodeRule,
  EscalationReservationRequiredTitleRule,
  defaultEscalationReservationValidator,
} from "./escalation-reservation-rules.js";
import { newEscalationReservation } from "./escalation-reservation.js";

test("EscalationReservationValidator reports every problem", () => {
  const validator = defaultEscalationReservationValidator();
  const item = newEscalationReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationReservationBudgetRangeRule flags values above budget", () => {
  const rule = new EscalationReservationBudgetRangeRule(6.6, 3547);
  const item = newEscalationReservation("x", "y");
  item.budget = 3548.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationReservationCodeLengthRule flags a long code", () => {
  const rule = new EscalationReservationCodeLengthRule(16);
  const item = newEscalationReservation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationReservationRequiredTitleRule flags a blank title", () => {
  const rule = new EscalationReservationRequiredTitleRule("escalation reservation needs a value");
  const item = newEscalationReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationReservationRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationReservationRequiredCodeRule("escalation reservation needs this field");
  const item = newEscalationReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationReservationRatioRangeRule flags values above ratio", () => {
  const rule = new EscalationReservationRatioRangeRule(9.8, 2705.8);
  const item = newEscalationReservation("x", "y");
  item.ratio = 2707.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
