import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightVarianceCategoryLengthRule,
  FlightVarianceCodeLengthRule,
  FlightVariancePriorityRangeRule,
  FlightVarianceRequiredCodeRule,
  defaultFlightVarianceValidator,
} from "./flight-variance-rules.js";
import { newFlightVariance } from "./flight-variance.js";

test("FlightVarianceValidator reports every problem", () => {
  const validator = defaultFlightVarianceValidator();
  const item = newFlightVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightVariancePriorityRangeRule flags values above priority", () => {
  const rule = new FlightVariancePriorityRangeRule(1000, 3600);
  const item = newFlightVariance("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new FlightVarianceRequiredCodeRule("flight variance needs this field");
  const item = newFlightVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightVarianceCodeLengthRule flags a long code", () => {
  const rule = new FlightVarianceCodeLengthRule(64);
  const item = newFlightVariance("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightVarianceCategoryLengthRule flags a long category", () => {
  const rule = new FlightVarianceCategoryLengthRule(86400);
  const item = newFlightVariance("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
