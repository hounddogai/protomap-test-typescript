import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultRedemptionReservationDiscountRangeRule,
  DefaultRedemptionReservationRequiredCodeRule,
  DefaultRedemptionReservationRequiredLabelRule,
  DefaultRedemptionReservationWeightRangeRule,
  defaultDefaultRedemptionReservationValidator,
} from "./default-redemption-reservation-rules.js";
import { newDefaultRedemptionReservation } from "./default-redemption-reservation.js";

test("DefaultRedemptionReservationValidator reports every problem", () => {
  const validator = defaultDefaultRedemptionReservationValidator();
  const item = newDefaultRedemptionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultRedemptionReservationDiscountRangeRule flags values above discount", () => {
  const rule = new DefaultRedemptionReservationDiscountRangeRule(0.7, 1074.2);
  const item = newDefaultRedemptionReservation("x", "y");
  item.discount = 1075.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultRedemptionReservationRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultRedemptionReservationRequiredCodeRule("default redemption reservation needs this field");
  const item = newDefaultRedemptionReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultRedemptionReservationWeightRangeRule flags values above weight", () => {
  const rule = new DefaultRedemptionReservationWeightRangeRule(0.1, 3726.8);
  const item = newDefaultRedemptionReservation("x", "y");
  item.weight = 3728.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultRedemptionReservationRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultRedemptionReservationRequiredLabelRule("default redemption reservation needs this field");
  const item = newDefaultRedemptionReservation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
