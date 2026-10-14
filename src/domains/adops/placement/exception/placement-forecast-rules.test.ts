import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementForecastMaximumRangeRule,
  PlacementForecastRequiredPhoneRule,
  PlacementForecastTitleLengthRule,
  PlacementForecastUtmSourceLengthRule,
  defaultPlacementForecastValidator,
} from "./placement-forecast-rules.js";
import { newPlacementForecast } from "./placement-forecast.js";

test("PlacementForecastValidator reports every problem", () => {
  const validator = defaultPlacementForecastValidator();
  const item = newPlacementForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementForecastRequiredPhoneRule flags a blank phone", () => {
  const rule = new PlacementForecastRequiredPhoneRule("placement forecast needs a value");
  const item = newPlacementForecast("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementForecastTitleLengthRule flags a long title", () => {
  const rule = new PlacementForecastTitleLengthRule(1000);
  const item = newPlacementForecast("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementForecastMaximumRangeRule flags values above maximum", () => {
  const rule = new PlacementForecastMaximumRangeRule(1.7, 3048.4);
  const item = newPlacementForecast("x", "y");
  item.maximum = 3049.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementForecastUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PlacementForecastUtmSourceLengthRule(1000);
  const item = newPlacementForecast("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
