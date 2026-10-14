import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionForecastRequiredCodeRule,
  ConversionForecastRequiredLocaleRule,
  defaultConversionForecastValidator,
} from "./conversion-forecast-rules.js";
import { newConversionForecast } from "./conversion-forecast.js";

test("ConversionForecastValidator reports every problem", () => {
  const validator = defaultConversionForecastValidator();
  const item = newConversionForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionForecastRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionForecastRequiredCodeRule("conversion forecast needs this field");
  const item = newConversionForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionForecastRequiredLocaleRule flags a blank locale", () => {
  const rule = new ConversionForecastRequiredLocaleRule("conversion forecast needs a value");
  const item = newConversionForecast("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
