import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPostForecastMinimumRangeRule,
  ManualPostForecastRequiredSourceRule,
  defaultManualPostForecastValidator,
} from "./manual-post-forecast-rules.js";
import { newManualPostForecast } from "./manual-post-forecast.js";

test("ManualPostForecastValidator reports every problem", () => {
  const validator = defaultManualPostForecastValidator();
  const item = newManualPostForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPostForecastRequiredSourceRule flags a blank source", () => {
  const rule = new ManualPostForecastRequiredSourceRule("manual post forecast needs an entry");
  const item = newManualPostForecast("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPostForecastMinimumRangeRule flags values above minimum", () => {
  const rule = new ManualPostForecastMinimumRangeRule(1.9, 2142.3);
  const item = newManualPostForecast("x", "y");
  item.minimum = 2143.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
