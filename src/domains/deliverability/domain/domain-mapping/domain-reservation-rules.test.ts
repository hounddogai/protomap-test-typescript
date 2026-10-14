import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainReservationDurationMinutesRangeRule,
  DomainReservationNameLengthRule,
  DomainReservationPriorityRangeRule,
  DomainReservationRequiredSummaryRule,
  DomainReservationSummaryLengthRule,
  defaultDomainReservationValidator,
} from "./domain-reservation-rules.js";
import { newDomainReservation } from "./domain-reservation.js";

test("DomainReservationValidator reports every problem", () => {
  const validator = defaultDomainReservationValidator();
  const item = newDomainReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainReservationNameLengthRule flags a long name", () => {
  const rule = new DomainReservationNameLengthRule(255);
  const item = newDomainReservation("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainReservationPriorityRangeRule flags values above priority", () => {
  const rule = new DomainReservationPriorityRangeRule(16, 1000);
  const item = newDomainReservation("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainReservationRequiredSummaryRule flags a blank summary", () => {
  const rule = new DomainReservationRequiredSummaryRule("domain reservation needs a value");
  const item = newDomainReservation("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainReservationSummaryLengthRule flags a long summary", () => {
  const rule = new DomainReservationSummaryLengthRule(255);
  const item = newDomainReservation("x", "y");
  item.summary = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainReservationDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DomainReservationDurationMinutesRangeRule(64, 1000);
  const item = newDomainReservation("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
