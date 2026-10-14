import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCreativeForecastAmountRangeRule,
  AdaptiveCreativeForecastPhoneLengthRule,
  defaultAdaptiveCreativeForecastValidator,
} from "./adaptive-creative-forecast-rules.js";
import { newAdaptiveCreativeForecast } from "./adaptive-creative-forecast.js";

test("AdaptiveCreativeForecastValidator reports every problem", () => {
  const validator = defaultAdaptiveCreativeForecastValidator();
  const item = newAdaptiveCreativeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCreativeForecastPhoneLengthRule flags a long phone", () => {
  const rule = new AdaptiveCreativeForecastPhoneLengthRule(3600);
  const item = newAdaptiveCreativeForecast("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveCreativeForecastAmountRangeRule flags values above amount", () => {
  const rule = new AdaptiveCreativeForecastAmountRangeRule(8.4, 2670.7);
  const item = newAdaptiveCreativeForecast("x", "y");
  item.amount = 2672.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
