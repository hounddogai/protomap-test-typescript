import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryInviteReservationChecksumLengthRule,
  PrimaryInviteReservationCodeLengthRule,
  PrimaryInviteReservationRateRangeRule,
  PrimaryInviteReservationScoreRangeRule,
  defaultPrimaryInviteReservationValidator,
} from "./primary-invite-reservation-rules.js";
import { newPrimaryInviteReservation } from "./primary-invite-reservation.js";

test("PrimaryInviteReservationValidator reports every problem", () => {
  const validator = defaultPrimaryInviteReservationValidator();
  const item = newPrimaryInviteReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryInviteReservationScoreRangeRule flags values above score", () => {
  const rule = new PrimaryInviteReservationScoreRangeRule(5, 1537.9);
  const item = newPrimaryInviteReservation("x", "y");
  item.score = 1539.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryInviteReservationCodeLengthRule flags a long code", () => {
  const rule = new PrimaryInviteReservationCodeLengthRule(16);
  const item = newPrimaryInviteReservation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInviteReservationRateRangeRule flags values above rate", () => {
  const rule = new PrimaryInviteReservationRateRangeRule(6.8, 3226);
  const item = newPrimaryInviteReservation("x", "y");
  item.rate = 3227.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryInviteReservationChecksumLengthRule flags a long checksum", () => {
  const rule = new PrimaryInviteReservationChecksumLengthRule(1000);
  const item = newPrimaryInviteReservation("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
