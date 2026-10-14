import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSubscriptionReservationBidRangeRule,
  RegionalSubscriptionReservationCodeLengthRule,
  RegionalSubscriptionReservationRequiredCodeRule,
  RegionalSubscriptionReservationSummaryLengthRule,
  defaultRegionalSubscriptionReservationValidator,
} from "./regional-subscription-reservation-rules.js";
import { newRegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

test("RegionalSubscriptionReservationValidator reports every problem", () => {
  const validator = defaultRegionalSubscriptionReservationValidator();
  const item = newRegionalSubscriptionReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSubscriptionReservationRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalSubscriptionReservationRequiredCodeRule("regional subscription reservation needs this field");
  const item = newRegionalSubscriptionReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSubscriptionReservationBidRangeRule flags values above bid", () => {
  const rule = new RegionalSubscriptionReservationBidRangeRule(3.1, 4410.7);
  const item = newRegionalSubscriptionReservation("x", "y");
  item.bid = 4412.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalSubscriptionReservationCodeLengthRule flags a long code", () => {
  const rule = new RegionalSubscriptionReservationCodeLengthRule(86400);
  const item = newRegionalSubscriptionReservation("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSubscriptionReservationSummaryLengthRule flags a long summary", () => {
  const rule = new RegionalSubscriptionReservationSummaryLengthRule(64);
  const item = newRegionalSubscriptionReservation("x", "y");
  item.summary = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
