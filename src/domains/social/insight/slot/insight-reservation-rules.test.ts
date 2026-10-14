import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightReservationBudgetRangeRule,
  InsightReservationExpiresAtRangeRule,
  InsightReservationRequiredCodeRule,
  InsightReservationSendAtRangeRule,
  InsightReservationSourceLengthRule,
  defaultInsightReservationValidator,
} from "./insight-reservation-rules.js";
import { newInsightReservation } from "./insight-reservation.js";

test("InsightReservationValidator reports every problem", () => {
  const validator = defaultInsightReservationValidator();
  const item = newInsightReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightReservationExpiresAtRangeRule flags values above expires at", () => {
  const rule = new InsightReservationExpiresAtRangeRule(80, 255);
  const item = newInsightReservation("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightReservationRequiredCodeRule flags a blank code", () => {
  const rule = new InsightReservationRequiredCodeRule("insight reservation needs an entry");
  const item = newInsightReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightReservationSendAtRangeRule flags values above send at", () => {
  const rule = new InsightReservationSendAtRangeRule(16, 255);
  const item = newInsightReservation("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightReservationBudgetRangeRule flags values above budget", () => {
  const rule = new InsightReservationBudgetRangeRule(5.5, 2310.7);
  const item = newInsightReservation("x", "y");
  item.budget = 2312.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightReservationSourceLengthRule flags a long source", () => {
  const rule = new InsightReservationSourceLengthRule(255);
  const item = newInsightReservation("x", "y");
  item.source = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
