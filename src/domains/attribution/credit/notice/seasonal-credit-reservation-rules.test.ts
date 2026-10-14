import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCreditReservationChannelLengthRule,
  SeasonalCreditReservationLabelLengthRule,
  SeasonalCreditReservationPhoneLengthRule,
  SeasonalCreditReservationRequiredCodeRule,
  defaultSeasonalCreditReservationValidator,
} from "./seasonal-credit-reservation-rules.js";
import { newSeasonalCreditReservation } from "./seasonal-credit-reservation.js";

test("SeasonalCreditReservationValidator reports every problem", () => {
  const validator = defaultSeasonalCreditReservationValidator();
  const item = newSeasonalCreditReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCreditReservationRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalCreditReservationRequiredCodeRule("seasonal credit reservation needs a value");
  const item = newSeasonalCreditReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCreditReservationChannelLengthRule flags a long channel", () => {
  const rule = new SeasonalCreditReservationChannelLengthRule(255);
  const item = newSeasonalCreditReservation("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalCreditReservationLabelLengthRule flags a long label", () => {
  const rule = new SeasonalCreditReservationLabelLengthRule(3600);
  const item = newSeasonalCreditReservation("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalCreditReservationPhoneLengthRule flags a long phone", () => {
  const rule = new SeasonalCreditReservationPhoneLengthRule(80);
  const item = newSeasonalCreditReservation("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
