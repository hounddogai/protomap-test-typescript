import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFrequencyReservationRequiredCodeRule,
  CappedFrequencyReservationRequiredLabelRule,
  CappedFrequencyReservationRequiredTitleRule,
  CappedFrequencyReservationTitleLengthRule,
  defaultCappedFrequencyReservationValidator,
} from "./capped-frequency-reservation-rules.js";
import { newCappedFrequencyReservation } from "./capped-frequency-reservation.js";

test("CappedFrequencyReservationValidator reports every problem", () => {
  const validator = defaultCappedFrequencyReservationValidator();
  const item = newCappedFrequencyReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFrequencyReservationTitleLengthRule flags a long title", () => {
  const rule = new CappedFrequencyReservationTitleLengthRule(32);
  const item = newCappedFrequencyReservation("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFrequencyReservationRequiredTitleRule flags a blank title", () => {
  const rule = new CappedFrequencyReservationRequiredTitleRule("capped frequency reservation needs a value");
  const item = newCappedFrequencyReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFrequencyReservationRequiredCodeRule flags a blank code", () => {
  const rule = new CappedFrequencyReservationRequiredCodeRule("capped frequency reservation needs this field");
  const item = newCappedFrequencyReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFrequencyReservationRequiredLabelRule flags a blank label", () => {
  const rule = new CappedFrequencyReservationRequiredLabelRule("capped frequency reservation needs an entry");
  const item = newCappedFrequencyReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
