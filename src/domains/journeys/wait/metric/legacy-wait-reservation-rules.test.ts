import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWaitReservationFloorValueRangeRule,
  LegacyWaitReservationRateRangeRule,
  LegacyWaitReservationRequiredCodeRule,
  LegacyWaitReservationRequiredTitleRule,
  LegacyWaitReservationRetriesRangeRule,
  LegacyWaitReservationUtmSourceLengthRule,
  defaultLegacyWaitReservationValidator,
} from "./legacy-wait-reservation-rules.js";
import { newLegacyWaitReservation } from "./legacy-wait-reservation.js";

test("LegacyWaitReservationValidator reports every problem", () => {
  const validator = defaultLegacyWaitReservationValidator();
  const item = newLegacyWaitReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWaitReservationUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LegacyWaitReservationUtmSourceLengthRule(120);
  const item = newLegacyWaitReservation("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyWaitReservationRetriesRangeRule flags values above retries", () => {
  const rule = new LegacyWaitReservationRetriesRangeRule(32, 255);
  const item = newLegacyWaitReservation("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWaitReservationRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyWaitReservationRequiredCodeRule("legacy wait reservation needs an entry");
  const item = newLegacyWaitReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyWaitReservationRateRangeRule flags values above rate", () => {
  const rule = new LegacyWaitReservationRateRangeRule(4.8, 2112.9);
  const item = newLegacyWaitReservation("x", "y");
  item.rate = 2114.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWaitReservationFloorValueRangeRule flags values above floor value", () => {
  const rule = new LegacyWaitReservationFloorValueRangeRule(4.8, 211.6);
  const item = newLegacyWaitReservation("x", "y");
  item.floorValue = 213.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyWaitReservationRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyWaitReservationRequiredTitleRule("legacy wait reservation needs an entry");
  const item = newLegacyWaitReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
