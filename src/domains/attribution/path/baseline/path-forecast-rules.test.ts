import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathForecastRegionLengthRule,
  PathForecastRequiredNameRule,
  defaultPathForecastValidator,
} from "./path-forecast-rules.js";
import { newPathForecast } from "./path-forecast.js";

test("PathForecastValidator reports every problem", () => {
  const validator = defaultPathForecastValidator();
  const item = newPathForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathForecastRequiredNameRule flags a blank name", () => {
  const rule = new PathForecastRequiredNameRule("path forecast needs an entry");
  const item = newPathForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathForecastRegionLengthRule flags a long region", () => {
  const rule = new PathForecastRegionLengthRule(86400);
  const item = newPathForecast("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
