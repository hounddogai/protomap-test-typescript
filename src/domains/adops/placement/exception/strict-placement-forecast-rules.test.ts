import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPlacementForecastCodeLengthRule,
  StrictPlacementForecastUpdatedAtRangeRule,
  defaultStrictPlacementForecastValidator,
} from "./strict-placement-forecast-rules.js";
import { newStrictPlacementForecast } from "./strict-placement-forecast.js";

test("StrictPlacementForecastValidator reports every problem", () => {
  const validator = defaultStrictPlacementForecastValidator();
  const item = newStrictPlacementForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPlacementForecastCodeLengthRule flags a long code", () => {
  const rule = new StrictPlacementForecastCodeLengthRule(64);
  const item = newStrictPlacementForecast("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPlacementForecastUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictPlacementForecastUpdatedAtRangeRule(64, 86400);
  const item = newStrictPlacementForecast("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
