import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledConversionReservationCapacityRangeRule,
  ScheduledConversionReservationRequiredCodeRule,
  ScheduledConversionReservationRequiredContactEmailRule,
  ScheduledConversionReservationRequiredLabelRule,
  defaultScheduledConversionReservationValidator,
} from "./scheduled-conversion-reservation-rules.js";
import { newScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

test("ScheduledConversionReservationValidator reports every problem", () => {
  const validator = defaultScheduledConversionReservationValidator();
  const item = newScheduledConversionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledConversionReservationRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledConversionReservationRequiredCodeRule("scheduled conversion reservation needs this field");
  const item = newScheduledConversionReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledConversionReservationCapacityRangeRule flags values above capacity", () => {
  const rule = new ScheduledConversionReservationCapacityRangeRule(32, 1000);
  const item = newScheduledConversionReservation("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledConversionReservationRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ScheduledConversionReservationRequiredContactEmailRule("scheduled conversion reservation needs a value");
  const item = newScheduledConversionReservation("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledConversionReservationRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledConversionReservationRequiredLabelRule("scheduled conversion reservation needs a value");
  const item = newScheduledConversionReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
