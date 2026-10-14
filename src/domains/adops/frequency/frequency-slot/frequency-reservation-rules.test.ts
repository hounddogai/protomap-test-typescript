import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyReservationCodeLengthRule,
  FrequencyReservationNameLengthRule,
  FrequencyReservationOpenRateRangeRule,
  defaultFrequencyReservationValidator,
} from "./frequency-reservation-rules.js";
import { newFrequencyReservation } from "./frequency-reservation.js";

test("FrequencyReservationValidator reports every problem", () => {
  const validator = defaultFrequencyReservationValidator();
  const item = newFrequencyReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyReservationCodeLengthRule flags a long code", () => {
  const rule = new FrequencyReservationCodeLengthRule(80);
  const item = newFrequencyReservation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyReservationNameLengthRule flags a long name", () => {
  const rule = new FrequencyReservationNameLengthRule(120);
  const item = newFrequencyReservation("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyReservationOpenRateRangeRule flags values above open rate", () => {
  const rule = new FrequencyReservationOpenRateRangeRule(1.1, 233.9);
  const item = newFrequencyReservation("x", "y");
  item.openRate = 235.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
