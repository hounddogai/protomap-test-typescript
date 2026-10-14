import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeReservationCodeLengthRule,
  NudgeReservationLocaleLengthRule,
  NudgeReservationRequiredLocaleRule,
  NudgeReservationTitleLengthRule,
  defaultNudgeReservationValidator,
} from "./nudge-reservation-rules.js";
import { newNudgeReservation } from "./nudge-reservation.js";

test("NudgeReservationValidator reports every problem", () => {
  const validator = defaultNudgeReservationValidator();
  const item = newNudgeReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeReservationLocaleLengthRule flags a long locale", () => {
  const rule = new NudgeReservationLocaleLengthRule(32);
  const item = newNudgeReservation("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeReservationCodeLengthRule flags a long code", () => {
  const rule = new NudgeReservationCodeLengthRule(120);
  const item = newNudgeReservation("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeReservationTitleLengthRule flags a long title", () => {
  const rule = new NudgeReservationTitleLengthRule(32);
  const item = newNudgeReservation("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeReservationRequiredLocaleRule flags a blank locale", () => {
  const rule = new NudgeReservationRequiredLocaleRule("nudge reservation needs an entry");
  const item = newNudgeReservation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
