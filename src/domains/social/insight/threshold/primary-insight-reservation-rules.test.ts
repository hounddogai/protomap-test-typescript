import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryInsightReservationImpressionsRangeRule,
  PrimaryInsightReservationLimitRangeRule,
  PrimaryInsightReservationRequiredNotesRule,
  PrimaryInsightReservationTimezoneLengthRule,
  defaultPrimaryInsightReservationValidator,
} from "./primary-insight-reservation-rules.js";
import { newPrimaryInsightReservation } from "./primary-insight-reservation.js";

test("PrimaryInsightReservationValidator reports every problem", () => {
  const validator = defaultPrimaryInsightReservationValidator();
  const item = newPrimaryInsightReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryInsightReservationLimitRangeRule flags values above limit", () => {
  const rule = new PrimaryInsightReservationLimitRangeRule(120, 86400);
  const item = newPrimaryInsightReservation("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryInsightReservationTimezoneLengthRule flags a long timezone", () => {
  const rule = new PrimaryInsightReservationTimezoneLengthRule(32);
  const item = newPrimaryInsightReservation("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInsightReservationImpressionsRangeRule flags values above impressions", () => {
  const rule = new PrimaryInsightReservationImpressionsRangeRule(80, 255);
  const item = newPrimaryInsightReservation("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryInsightReservationRequiredNotesRule flags a blank notes", () => {
  const rule = new PrimaryInsightReservationRequiredNotesRule("primary insight reservation needs this field");
  const item = newPrimaryInsightReservation("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
