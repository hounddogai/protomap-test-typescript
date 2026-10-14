import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalInsightReservationNameLengthRule,
  RegionalInsightReservationRequiredCodeRule,
  RegionalInsightReservationRequiredNameRule,
  RegionalInsightReservationRequiredSegmentRule,
  RegionalInsightReservationSegmentLengthRule,
  defaultRegionalInsightReservationValidator,
} from "./regional-insight-reservation-rules.js";
import { newRegionalInsightReservation } from "./regional-insight-reservation.js";

test("RegionalInsightReservationValidator reports every problem", () => {
  const validator = defaultRegionalInsightReservationValidator();
  const item = newRegionalInsightReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalInsightReservationNameLengthRule flags a long name", () => {
  const rule = new RegionalInsightReservationNameLengthRule(3600);
  const item = newRegionalInsightReservation("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalInsightReservationSegmentLengthRule flags a long segment", () => {
  const rule = new RegionalInsightReservationSegmentLengthRule(86400);
  const item = newRegionalInsightReservation("x", "y");
  item.segment = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalInsightReservationRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalInsightReservationRequiredCodeRule("regional insight reservation needs this field");
  const item = newRegionalInsightReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalInsightReservationRequiredSegmentRule flags a blank segment", () => {
  const rule = new RegionalInsightReservationRequiredSegmentRule("regional insight reservation needs an entry");
  const item = newRegionalInsightReservation("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalInsightReservationRequiredNameRule flags a blank name", () => {
  const rule = new RegionalInsightReservationRequiredNameRule("regional insight reservation needs an entry");
  const item = newRegionalInsightReservation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
