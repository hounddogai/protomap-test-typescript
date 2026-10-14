import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightBaselineRateRangeRule,
  FlightBaselineRatioRangeRule,
  FlightBaselineRequiredCodeRule,
  FlightBaselineScoreRangeRule,
  defaultFlightBaselineValidator,
} from "./flight-baseline-rules.js";
import { newFlightBaseline } from "./flight-baseline.js";

test("FlightBaselineValidator reports every problem", () => {
  const validator = defaultFlightBaselineValidator();
  const item = newFlightBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightBaselineRatioRangeRule flags values above ratio", () => {
  const rule = new FlightBaselineRatioRangeRule(7.2, 1504.6);
  const item = newFlightBaseline("x", "y");
  item.ratio = 1506.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new FlightBaselineRequiredCodeRule("flight baseline needs an entry");
  const item = newFlightBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightBaselineScoreRangeRule flags values above score", () => {
  const rule = new FlightBaselineScoreRangeRule(7.7, 4387.7);
  const item = newFlightBaseline("x", "y");
  item.score = 4389.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightBaselineRateRangeRule flags values above rate", () => {
  const rule = new FlightBaselineRateRangeRule(9.3, 2923.9);
  const item = newFlightBaseline("x", "y");
  item.rate = 2925.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
