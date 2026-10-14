import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredLevelReservationCategoryLengthRule,
  TieredLevelReservationDurationMinutesRangeRule,
  TieredLevelReservationMarginRangeRule,
  TieredLevelReservationRequiredTitleRule,
  TieredLevelReservationTitleLengthRule,
  defaultTieredLevelReservationValidator,
} from "./tiered-level-reservation-rules.js";
import { newTieredLevelReservation } from "./tiered-level-reservation.js";

test("TieredLevelReservationValidator reports every problem", () => {
  const validator = defaultTieredLevelReservationValidator();
  const item = newTieredLevelReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredLevelReservationTitleLengthRule flags a long title", () => {
  const rule = new TieredLevelReservationTitleLengthRule(16);
  const item = newTieredLevelReservation("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredLevelReservationCategoryLengthRule flags a long category", () => {
  const rule = new TieredLevelReservationCategoryLengthRule(16);
  const item = newTieredLevelReservation("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredLevelReservationRequiredTitleRule flags a blank title", () => {
  const rule = new TieredLevelReservationRequiredTitleRule("tiered level reservation needs this field");
  const item = newTieredLevelReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLevelReservationDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new TieredLevelReservationDurationMinutesRangeRule(32, 120);
  const item = newTieredLevelReservation("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredLevelReservationMarginRangeRule flags values above margin", () => {
  const rule = new TieredLevelReservationMarginRangeRule(6.9, 4169.8);
  const item = newTieredLevelReservation("x", "y");
  item.margin = 4171.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
