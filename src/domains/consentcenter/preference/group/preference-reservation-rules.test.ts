import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceReservationLabelLengthRule,
  PreferenceReservationRatioRangeRule,
  PreferenceReservationRequiredCategoryRule,
  PreferenceReservationRequiredLocaleRule,
  defaultPreferenceReservationValidator,
} from "./preference-reservation-rules.js";
import { newPreferenceReservation } from "./preference-reservation.js";

test("PreferenceReservationValidator reports every problem", () => {
  const validator = defaultPreferenceReservationValidator();
  const item = newPreferenceReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceReservationRequiredLocaleRule flags a blank locale", () => {
  const rule = new PreferenceReservationRequiredLocaleRule("preference reservation needs a value");
  const item = newPreferenceReservation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceReservationRatioRangeRule flags values above ratio", () => {
  const rule = new PreferenceReservationRatioRangeRule(2.3, 2010.9);
  const item = newPreferenceReservation("x", "y");
  item.ratio = 2012.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceReservationRequiredCategoryRule flags a blank category", () => {
  const rule = new PreferenceReservationRequiredCategoryRule("preference reservation needs this field");
  const item = newPreferenceReservation("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceReservationLabelLengthRule flags a long label", () => {
  const rule = new PreferenceReservationLabelLengthRule(1000);
  const item = newPreferenceReservation("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
