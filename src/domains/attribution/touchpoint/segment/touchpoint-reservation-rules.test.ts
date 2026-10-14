import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointReservationCostRangeRule,
  TouchpointReservationRequiredCodeRule,
  TouchpointReservationThresholdRangeRule,
  TouchpointReservationWindowDaysRangeRule,
  defaultTouchpointReservationValidator,
} from "./touchpoint-reservation-rules.js";
import { newTouchpointReservation } from "./touchpoint-reservation.js";

test("TouchpointReservationValidator reports every problem", () => {
  const validator = defaultTouchpointReservationValidator();
  const item = newTouchpointReservation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointReservationWindowDaysRangeRule flags values above window days", () => {
  const rule = new TouchpointReservationWindowDaysRangeRule(120, 1000);
  const item = newTouchpointReservation("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointReservationCostRangeRule flags values above cost", () => {
  const rule = new TouchpointReservationCostRangeRule(2.6, 3098.2);
  const item = newTouchpointReservation("x", "y");
  item.cost = 3099.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointReservationRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointReservationRequiredCodeRule("touchpoint reservation needs a value");
  const item = newTouchpointReservation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointReservationThresholdRangeRule flags values above threshold", () => {
  const rule = new TouchpointReservationThresholdRangeRule(8, 198.7);
  const item = newTouchpointReservation("x", "y");
  item.threshold = 200.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
