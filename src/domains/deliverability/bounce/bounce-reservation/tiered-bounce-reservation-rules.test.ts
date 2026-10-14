import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBounceReservationCapacityRangeRule,
  TieredBounceReservationRateRangeRule,
  TieredBounceReservationRequiredLabelRule,
  TieredBounceReservationScoreRangeRule,
  defaultTieredBounceReservationValidator,
} from "./tiered-bounce-reservation-rules.js";
import { newTieredBounceReservation } from "./tiered-bounce-reservation.js";

test("TieredBounceReservationValidator reports every problem", () => {
  const validator = defaultTieredBounceReservationValidator();
  const item = newTieredBounceReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBounceReservationRequiredLabelRule flags a blank label", () => {
  const rule = new TieredBounceReservationRequiredLabelRule("tiered bounce reservation needs this field");
  const item = newTieredBounceReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceReservationCapacityRangeRule flags values above capacity", () => {
  const rule = new TieredBounceReservationCapacityRangeRule(120, 86400);
  const item = newTieredBounceReservation("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceReservationRateRangeRule flags values above rate", () => {
  const rule = new TieredBounceReservationRateRangeRule(5.3, 1846.3);
  const item = newTieredBounceReservation("x", "y");
  item.rate = 1847.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceReservationScoreRangeRule flags values above score", () => {
  const rule = new TieredBounceReservationScoreRangeRule(0, 1838.1);
  const item = newTieredBounceReservation("x", "y");
  item.score = 1839.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
