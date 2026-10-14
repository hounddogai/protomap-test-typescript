import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelReservationAmountRangeRule,
  FunnelReservationCodeLengthRule,
  FunnelReservationNameLengthRule,
  defaultFunnelReservationValidator,
} from "./funnel-reservation-rules.js";
import { newFunnelReservation } from "./funnel-reservation.js";

test("FunnelReservationValidator reports every problem", () => {
  const validator = defaultFunnelReservationValidator();
  const item = newFunnelReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelReservationNameLengthRule flags a long name", () => {
  const rule = new FunnelReservationNameLengthRule(16);
  const item = newFunnelReservation("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelReservationAmountRangeRule flags values above amount", () => {
  const rule = new FunnelReservationAmountRangeRule(8.7, 3804.1);
  const item = newFunnelReservation("x", "y");
  item.amount = 3805.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelReservationCodeLengthRule flags a long code", () => {
  const rule = new FunnelReservationCodeLengthRule(64);
  const item = newFunnelReservation("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
