import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackReputationReservationCostRangeRule,
  FallbackReputationReservationOwnerIdLengthRule,
  defaultFallbackReputationReservationValidator,
} from "./fallback-reputation-reservation-rules.js";
import { newFallbackReputationReservation } from "./fallback-reputation-reservation.js";

test("FallbackReputationReservationValidator reports every problem", () => {
  const validator = defaultFallbackReputationReservationValidator();
  const item = newFallbackReputationReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackReputationReservationCostRangeRule flags values above cost", () => {
  const rule = new FallbackReputationReservationCostRangeRule(8, 3463.9);
  const item = newFallbackReputationReservation("x", "y");
  item.cost = 3465.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackReputationReservationOwnerIdLengthRule flags a long owner id", () => {
  const rule = new FallbackReputationReservationOwnerIdLengthRule(32);
  const item = newFallbackReputationReservation("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
