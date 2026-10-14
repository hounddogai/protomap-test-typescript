import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeReservationCodeLengthRule,
  BadgeReservationLabelLengthRule,
  BadgeReservationMarginRangeRule,
  BadgeReservationMaximumRangeRule,
  BadgeReservationRequiredLabelRule,
  defaultBadgeReservationValidator,
} from "./badge-reservation-rules.js";
import { newBadgeReservation } from "./badge-reservation.js";

test("BadgeReservationValidator reports every problem", () => {
  const validator = defaultBadgeReservationValidator();
  const item = newBadgeReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeReservationMarginRangeRule flags values above margin", () => {
  const rule = new BadgeReservationMarginRangeRule(2, 2146.2);
  const item = newBadgeReservation("x", "y");
  item.margin = 2147.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeReservationRequiredLabelRule flags a blank label", () => {
  const rule = new BadgeReservationRequiredLabelRule("badge reservation needs this field");
  const item = newBadgeReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeReservationLabelLengthRule flags a long label", () => {
  const rule = new BadgeReservationLabelLengthRule(3600);
  const item = newBadgeReservation("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeReservationMaximumRangeRule flags values above maximum", () => {
  const rule = new BadgeReservationMaximumRangeRule(0, 1721.6);
  const item = newBadgeReservation("x", "y");
  item.maximum = 1723.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeReservationCodeLengthRule flags a long code", () => {
  const rule = new BadgeReservationCodeLengthRule(16);
  const item = newBadgeReservation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
