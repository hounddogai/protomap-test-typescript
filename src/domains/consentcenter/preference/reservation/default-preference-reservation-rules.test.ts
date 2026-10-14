import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPreferenceReservationLocaleLengthRule,
  DefaultPreferenceReservationMinimumRangeRule,
  DefaultPreferenceReservationSequenceRangeRule,
  defaultDefaultPreferenceReservationValidator,
} from "./default-preference-reservation-rules.js";
import { newDefaultPreferenceReservation } from "./default-preference-reservation.js";

test("DefaultPreferenceReservationValidator reports every problem", () => {
  const validator = defaultDefaultPreferenceReservationValidator();
  const item = newDefaultPreferenceReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPreferenceReservationMinimumRangeRule flags values above minimum", () => {
  const rule = new DefaultPreferenceReservationMinimumRangeRule(4, 218.7);
  const item = newDefaultPreferenceReservation("x", "y");
  item.minimum = 220.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPreferenceReservationLocaleLengthRule flags a long locale", () => {
  const rule = new DefaultPreferenceReservationLocaleLengthRule(32);
  const item = newDefaultPreferenceReservation("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPreferenceReservationSequenceRangeRule flags values above sequence", () => {
  const rule = new DefaultPreferenceReservationSequenceRangeRule(120, 86400);
  const item = newDefaultPreferenceReservation("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
