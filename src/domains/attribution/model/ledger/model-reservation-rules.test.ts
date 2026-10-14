import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelReservationCodeLengthRule,
  ModelReservationRequiredSourceRule,
  ModelReservationSourceLengthRule,
  defaultModelReservationValidator,
} from "./model-reservation-rules.js";
import { newModelReservation } from "./model-reservation.js";

test("ModelReservationValidator reports every problem", () => {
  const validator = defaultModelReservationValidator();
  const item = newModelReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelReservationSourceLengthRule flags a long source", () => {
  const rule = new ModelReservationSourceLengthRule(16);
  const item = newModelReservation("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelReservationCodeLengthRule flags a long code", () => {
  const rule = new ModelReservationCodeLengthRule(16);
  const item = newModelReservation("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelReservationRequiredSourceRule flags a blank source", () => {
  const rule = new ModelReservationRequiredSourceRule("model reservation needs a value");
  const item = newModelReservation("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
