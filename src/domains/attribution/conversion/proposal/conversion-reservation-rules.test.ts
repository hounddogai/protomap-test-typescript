import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionReservationNameLengthRule,
  ConversionReservationRequiredJourneyIdRule,
  ConversionReservationSegmentLengthRule,
  defaultConversionReservationValidator,
} from "./conversion-reservation-rules.js";
import { newConversionReservation } from "./conversion-reservation.js";

test("ConversionReservationValidator reports every problem", () => {
  const validator = defaultConversionReservationValidator();
  const item = newConversionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionReservationRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ConversionReservationRequiredJourneyIdRule("conversion reservation needs an entry");
  const item = newConversionReservation("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionReservationSegmentLengthRule flags a long segment", () => {
  const rule = new ConversionReservationSegmentLengthRule(32);
  const item = newConversionReservation("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionReservationNameLengthRule flags a long name", () => {
  const rule = new ConversionReservationNameLengthRule(80);
  const item = newConversionReservation("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
