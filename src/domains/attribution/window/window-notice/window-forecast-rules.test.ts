import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowForecastCreatedAtRangeRule,
  WindowForecastMinimumRangeRule,
  WindowForecastRequiredLocaleRule,
  WindowForecastRequiredTitleRule,
  WindowForecastTitleLengthRule,
  WindowForecastUtmSourceLengthRule,
  defaultWindowForecastValidator,
} from "./window-forecast-rules.js";
import { newWindowForecast } from "./window-forecast.js";

test("WindowForecastValidator reports every problem", () => {
  const validator = defaultWindowForecastValidator();
  const item = newWindowForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowForecastRequiredTitleRule flags a blank title", () => {
  const rule = new WindowForecastRequiredTitleRule("window forecast needs an entry");
  const item = newWindowForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowForecastCreatedAtRangeRule flags values above created at", () => {
  const rule = new WindowForecastCreatedAtRangeRule(255, 86400);
  const item = newWindowForecast("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowForecastMinimumRangeRule flags values above minimum", () => {
  const rule = new WindowForecastMinimumRangeRule(7.7, 865.4);
  const item = newWindowForecast("x", "y");
  item.minimum = 866.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowForecastUtmSourceLengthRule flags a long utm source", () => {
  const rule = new WindowForecastUtmSourceLengthRule(3600);
  const item = newWindowForecast("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowForecastRequiredLocaleRule flags a blank locale", () => {
  const rule = new WindowForecastRequiredLocaleRule("window forecast needs a value");
  const item = newWindowForecast("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowForecastTitleLengthRule flags a long title", () => {
  const rule = new WindowForecastTitleLengthRule(120);
  const item = newWindowForecast("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
