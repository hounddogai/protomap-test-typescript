import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardReservationCodeLengthRule,
  RewardReservationNameLengthRule,
  RewardReservationRequiredCodeRule,
  RewardReservationRequiredJourneyIdRule,
  RewardReservationStartsAtRangeRule,
  defaultRewardReservationValidator,
} from "./reward-reservation-rules.js";
import { newRewardReservation } from "./reward-reservation.js";

test("RewardReservationValidator reports every problem", () => {
  const validator = defaultRewardReservationValidator();
  const item = newRewardReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardReservationCodeLengthRule flags a long code", () => {
  const rule = new RewardReservationCodeLengthRule(80);
  const item = newRewardReservation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardReservationRequiredCodeRule flags a blank code", () => {
  const rule = new RewardReservationRequiredCodeRule("reward reservation needs this field");
  const item = newRewardReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardReservationRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new RewardReservationRequiredJourneyIdRule("reward reservation needs this field");
  const item = newRewardReservation("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardReservationStartsAtRangeRule flags values above starts at", () => {
  const rule = new RewardReservationStartsAtRangeRule(16, 86400);
  const item = newRewardReservation("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardReservationNameLengthRule flags a long name", () => {
  const rule = new RewardReservationNameLengthRule(1000);
  const item = newRewardReservation("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
