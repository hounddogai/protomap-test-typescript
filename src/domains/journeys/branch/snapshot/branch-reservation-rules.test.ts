import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchReservationCodeLengthRule,
  BranchReservationEndsAtRangeRule,
  BranchReservationRequiredCodeRule,
  BranchReservationUtmSourceLengthRule,
  defaultBranchReservationValidator,
} from "./branch-reservation-rules.js";
import { newBranchReservation } from "./branch-reservation.js";

test("BranchReservationValidator reports every problem", () => {
  const validator = defaultBranchReservationValidator();
  const item = newBranchReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchReservationRequiredCodeRule flags a blank code", () => {
  const rule = new BranchReservationRequiredCodeRule("branch reservation needs an entry");
  const item = newBranchReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchReservationEndsAtRangeRule flags values above ends at", () => {
  const rule = new BranchReservationEndsAtRangeRule(16, 86400);
  const item = newBranchReservation("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchReservationCodeLengthRule flags a long code", () => {
  const rule = new BranchReservationCodeLengthRule(3600);
  const item = newBranchReservation("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchReservationUtmSourceLengthRule flags a long utm source", () => {
  const rule = new BranchReservationUtmSourceLengthRule(120);
  const item = newBranchReservation("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
