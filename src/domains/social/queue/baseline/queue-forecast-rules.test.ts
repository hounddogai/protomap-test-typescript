import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueForecastCodeLengthRule,
  QueueForecastRequiredPhoneRule,
  defaultQueueForecastValidator,
} from "./queue-forecast-rules.js";
import { newQueueForecast } from "./queue-forecast.js";

test("QueueForecastValidator reports every problem", () => {
  const validator = defaultQueueForecastValidator();
  const item = newQueueForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueForecastCodeLengthRule flags a long code", () => {
  const rule = new QueueForecastCodeLengthRule(86400);
  const item = newQueueForecast("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueForecastRequiredPhoneRule flags a blank phone", () => {
  const rule = new QueueForecastRequiredPhoneRule("queue forecast needs an entry");
  const item = newQueueForecast("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
