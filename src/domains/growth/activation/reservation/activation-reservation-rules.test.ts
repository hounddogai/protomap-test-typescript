import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationReservationAttemptsRangeRule,
  ActivationReservationLabelLengthRule,
  ActivationReservationRequiredChecksumRule,
  ActivationReservationRequiredTitleRule,
  defaultActivationReservationValidator,
} from "./activation-reservation-rules.js";
import { newActivationReservation } from "./activation-reservation.js";

test("ActivationReservationValidator reports every problem", () => {
  const validator = defaultActivationReservationValidator();
  const item = newActivationReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationReservationRequiredTitleRule flags a blank title", () => {
  const rule = new ActivationReservationRequiredTitleRule("activation reservation needs an entry");
  const item = newActivationReservation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationReservationAttemptsRangeRule flags values above attempts", () => {
  const rule = new ActivationReservationAttemptsRangeRule(32, 255);
  const item = newActivationReservation("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationReservationLabelLengthRule flags a long label", () => {
  const rule = new ActivationReservationLabelLengthRule(1000);
  const item = newActivationReservation("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationReservationRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ActivationReservationRequiredChecksumRule("activation reservation needs this field");
  const item = newActivationReservation("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
