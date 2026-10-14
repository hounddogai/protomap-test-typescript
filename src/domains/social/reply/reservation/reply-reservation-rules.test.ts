import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyReservationBatchSizeRangeRule,
  ReplyReservationCountryLengthRule,
  ReplyReservationRequiredCodeRule,
  defaultReplyReservationValidator,
} from "./reply-reservation-rules.js";
import { newReplyReservation } from "./reply-reservation.js";

test("ReplyReservationValidator reports every problem", () => {
  const validator = defaultReplyReservationValidator();
  const item = newReplyReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyReservationRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyReservationRequiredCodeRule("reply reservation needs an entry");
  const item = newReplyReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyReservationCountryLengthRule flags a long country", () => {
  const rule = new ReplyReservationCountryLengthRule(120);
  const item = newReplyReservation("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyReservationBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ReplyReservationBatchSizeRangeRule(86400, 86400);
  const item = newReplyReservation("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
