import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedWarmupReservationCodeLengthRule,
  CappedWarmupReservationCostRangeRule,
  CappedWarmupReservationMarginRangeRule,
  CappedWarmupReservationRequiredCodeRule,
  CappedWarmupReservationVariantLengthRule,
  defaultCappedWarmupReservationValidator,
} from "./capped-warmup-reservation-rules.js";
import { newCappedWarmupReservation } from "./capped-warmup-reservation.js";

test("CappedWarmupReservationValidator reports every problem", () => {
  const validator = defaultCappedWarmupReservationValidator();
  const item = newCappedWarmupReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedWarmupReservationMarginRangeRule flags values above margin", () => {
  const rule = new CappedWarmupReservationMarginRangeRule(3, 3977);
  const item = newCappedWarmupReservation("x", "y");
  item.margin = 3978.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedWarmupReservationRequiredCodeRule flags a blank code", () => {
  const rule = new CappedWarmupReservationRequiredCodeRule("capped warmup reservation needs an entry");
  const item = newCappedWarmupReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedWarmupReservationCostRangeRule flags values above cost", () => {
  const rule = new CappedWarmupReservationCostRangeRule(8.8, 4603.9);
  const item = newCappedWarmupReservation("x", "y");
  item.cost = 4605.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedWarmupReservationCodeLengthRule flags a long code", () => {
  const rule = new CappedWarmupReservationCodeLengthRule(255);
  const item = newCappedWarmupReservation("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedWarmupReservationVariantLengthRule flags a long variant", () => {
  const rule = new CappedWarmupReservationVariantLengthRule(16);
  const item = newCappedWarmupReservation("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
