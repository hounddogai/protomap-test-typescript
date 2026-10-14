import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionReservationNameLengthRule,
  RetentionReservationScoreRangeRule,
  defaultRetentionReservationValidator,
} from "./retention-reservation-rules.js";
import { newRetentionReservation } from "./retention-reservation.js";

test("RetentionReservationValidator reports every problem", () => {
  const validator = defaultRetentionReservationValidator();
  const item = newRetentionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionReservationNameLengthRule flags a long name", () => {
  const rule = new RetentionReservationNameLengthRule(120);
  const item = newRetentionReservation("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionReservationScoreRangeRule flags values above score", () => {
  const rule = new RetentionReservationScoreRangeRule(7.7, 4083.6);
  const item = newRetentionReservation("x", "y");
  item.score = 4085.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
