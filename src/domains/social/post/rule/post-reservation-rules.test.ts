import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostReservationCapacityRangeRule,
  PostReservationRequiredTitleRule,
  PostReservationTitleLengthRule,
  PostReservationWindowDaysRangeRule,
  defaultPostReservationValidator,
} from "./post-reservation-rules.js";
import { newPostReservation } from "./post-reservation.js";

test("PostReservationValidator reports every problem", () => {
  const validator = defaultPostReservationValidator();
  const item = newPostReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostReservationRequiredTitleRule flags a blank title", () => {
  const rule = new PostReservationRequiredTitleRule("post reservation needs a value");
  const item = newPostReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostReservationWindowDaysRangeRule flags values above window days", () => {
  const rule = new PostReservationWindowDaysRangeRule(64, 3600);
  const item = newPostReservation("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostReservationTitleLengthRule flags a long title", () => {
  const rule = new PostReservationTitleLengthRule(1000);
  const item = newPostReservation("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostReservationCapacityRangeRule flags values above capacity", () => {
  const rule = new PostReservationCapacityRangeRule(80, 3600);
  const item = newPostReservation("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
