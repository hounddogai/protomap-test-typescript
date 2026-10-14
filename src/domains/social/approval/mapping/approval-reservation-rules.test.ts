import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalReservationRequiredCodeRule,
  ApprovalReservationRequiredUtmSourceRule,
  ApprovalReservationTitleLengthRule,
  ApprovalReservationUtmSourceLengthRule,
  defaultApprovalReservationValidator,
} from "./approval-reservation-rules.js";
import { newApprovalReservation } from "./approval-reservation.js";

test("ApprovalReservationValidator reports every problem", () => {
  const validator = defaultApprovalReservationValidator();
  const item = newApprovalReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalReservationRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalReservationRequiredCodeRule("approval reservation needs an entry");
  const item = newApprovalReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalReservationRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new ApprovalReservationRequiredUtmSourceRule("approval reservation needs an entry");
  const item = newApprovalReservation("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalReservationTitleLengthRule flags a long title", () => {
  const rule = new ApprovalReservationTitleLengthRule(16);
  const item = newApprovalReservation("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalReservationUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ApprovalReservationUtmSourceLengthRule(80);
  const item = newApprovalReservation("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
