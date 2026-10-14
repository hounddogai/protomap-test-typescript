import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSuppressionReservationCreatedAtRangeRule,
  FallbackSuppressionReservationOwnerIdLengthRule,
  FallbackSuppressionReservationRequiredUnitRule,
  FallbackSuppressionReservationUnitLengthRule,
  defaultFallbackSuppressionReservationValidator,
} from "./fallback-suppression-reservation-rules.js";
import { newFallbackSuppressionReservation } from "./fallback-suppression-reservation.js";

test("FallbackSuppressionReservationValidator reports every problem", () => {
  const validator = defaultFallbackSuppressionReservationValidator();
  const item = newFallbackSuppressionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSuppressionReservationCreatedAtRangeRule flags values above created at", () => {
  const rule = new FallbackSuppressionReservationCreatedAtRangeRule(1000, 3600);
  const item = newFallbackSuppressionReservation("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSuppressionReservationUnitLengthRule flags a long unit", () => {
  const rule = new FallbackSuppressionReservationUnitLengthRule(16);
  const item = newFallbackSuppressionReservation("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSuppressionReservationRequiredUnitRule flags a blank unit", () => {
  const rule = new FallbackSuppressionReservationRequiredUnitRule("fallback suppression reservation needs a value");
  const item = newFallbackSuppressionReservation("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSuppressionReservationOwnerIdLengthRule flags a long owner id", () => {
  const rule = new FallbackSuppressionReservationOwnerIdLengthRule(3600);
  const item = newFallbackSuppressionReservation("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
