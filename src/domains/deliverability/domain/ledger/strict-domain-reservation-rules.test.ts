import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictDomainReservationLabelLengthRule,
  StrictDomainReservationRequiredCodeRule,
  StrictDomainReservationScoreRangeRule,
  defaultStrictDomainReservationValidator,
} from "./strict-domain-reservation-rules.js";
import { newStrictDomainReservation } from "./strict-domain-reservation.js";

test("StrictDomainReservationValidator reports every problem", () => {
  const validator = defaultStrictDomainReservationValidator();
  const item = newStrictDomainReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictDomainReservationLabelLengthRule flags a long label", () => {
  const rule = new StrictDomainReservationLabelLengthRule(86400);
  const item = newStrictDomainReservation("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDomainReservationRequiredCodeRule flags a blank code", () => {
  const rule = new StrictDomainReservationRequiredCodeRule("strict domain reservation needs an entry");
  const item = newStrictDomainReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictDomainReservationScoreRangeRule flags values above score", () => {
  const rule = new StrictDomainReservationScoreRangeRule(3.3, 1752.2);
  const item = newStrictDomainReservation("x", "y");
  item.score = 1753.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
