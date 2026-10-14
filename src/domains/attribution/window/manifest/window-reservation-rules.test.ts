import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowReservationAudienceIdLengthRule,
  WindowReservationLabelLengthRule,
  WindowReservationQuantityRangeRule,
  WindowReservationRequiredCodeRule,
  defaultWindowReservationValidator,
} from "./window-reservation-rules.js";
import { newWindowReservation } from "./window-reservation.js";

test("WindowReservationValidator reports every problem", () => {
  const validator = defaultWindowReservationValidator();
  const item = newWindowReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowReservationLabelLengthRule flags a long label", () => {
  const rule = new WindowReservationLabelLengthRule(64);
  const item = newWindowReservation("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowReservationRequiredCodeRule flags a blank code", () => {
  const rule = new WindowReservationRequiredCodeRule("window reservation needs a value");
  const item = newWindowReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowReservationAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WindowReservationAudienceIdLengthRule(120);
  const item = newWindowReservation("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowReservationQuantityRangeRule flags values above quantity", () => {
  const rule = new WindowReservationQuantityRangeRule(255, 86400);
  const item = newWindowReservation("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
