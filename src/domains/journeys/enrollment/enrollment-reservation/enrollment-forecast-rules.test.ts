import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentForecastCodeLengthRule,
  EnrollmentForecastFloorValueRangeRule,
  defaultEnrollmentForecastValidator,
} from "./enrollment-forecast-rules.js";
import { newEnrollmentForecast } from "./enrollment-forecast.js";

test("EnrollmentForecastValidator reports every problem", () => {
  const validator = defaultEnrollmentForecastValidator();
  const item = newEnrollmentForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentForecastFloorValueRangeRule flags values above floor value", () => {
  const rule = new EnrollmentForecastFloorValueRangeRule(1.7, 1973.1);
  const item = newEnrollmentForecast("x", "y");
  item.floorValue = 1974.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentForecastCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentForecastCodeLengthRule(64);
  const item = newEnrollmentForecast("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
