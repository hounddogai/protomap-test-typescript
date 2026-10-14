import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSenderReservationChannelLengthRule,
  FallbackSenderReservationCodeLengthRule,
  FallbackSenderReservationCurrencyLengthRule,
  FallbackSenderReservationRequiredCodeRule,
  FallbackSenderReservationRequiredCurrencyRule,
  defaultFallbackSenderReservationValidator,
} from "./fallback-sender-reservation-rules.js";
import { newFallbackSenderReservation } from "./fallback-sender-reservation.js";

test("FallbackSenderReservationValidator reports every problem", () => {
  const validator = defaultFallbackSenderReservationValidator();
  const item = newFallbackSenderReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSenderReservationCodeLengthRule flags a long code", () => {
  const rule = new FallbackSenderReservationCodeLengthRule(32);
  const item = newFallbackSenderReservation("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSenderReservationRequiredCurrencyRule flags a blank currency", () => {
  const rule = new FallbackSenderReservationRequiredCurrencyRule("fallback sender reservation needs this field");
  const item = newFallbackSenderReservation("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSenderReservationCurrencyLengthRule flags a long currency", () => {
  const rule = new FallbackSenderReservationCurrencyLengthRule(1000);
  const item = newFallbackSenderReservation("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSenderReservationChannelLengthRule flags a long channel", () => {
  const rule = new FallbackSenderReservationChannelLengthRule(80);
  const item = newFallbackSenderReservation("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSenderReservationRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackSenderReservationRequiredCodeRule("fallback sender reservation needs an entry");
  const item = newFallbackSenderReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
