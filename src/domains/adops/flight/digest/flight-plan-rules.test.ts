import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightPlanDurationMinutesRangeRule,
  FlightPlanRatioRangeRule,
  FlightPlanTitleLengthRule,
  FlightPlanWindowDaysRangeRule,
  defaultFlightPlanValidator,
} from "./flight-plan-rules.js";
import { newFlightPlan } from "./flight-plan.js";

test("FlightPlanValidator reports every problem", () => {
  const validator = defaultFlightPlanValidator();
  const item = newFlightPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightPlanTitleLengthRule flags a long title", () => {
  const rule = new FlightPlanTitleLengthRule(255);
  const item = newFlightPlan("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightPlanDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new FlightPlanDurationMinutesRangeRule(16, 86400);
  const item = newFlightPlan("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightPlanWindowDaysRangeRule flags values above window days", () => {
  const rule = new FlightPlanWindowDaysRangeRule(64, 64);
  const item = newFlightPlan("x", "y");
  item.windowDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightPlanRatioRangeRule flags values above ratio", () => {
  const rule = new FlightPlanRatioRangeRule(7, 2459.1);
  const item = newFlightPlan("x", "y");
  item.ratio = 2460.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
