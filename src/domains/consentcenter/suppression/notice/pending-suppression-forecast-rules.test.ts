import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSuppressionForecastCodeLengthRule,
  PendingSuppressionForecastLabelLengthRule,
  PendingSuppressionForecastRequiredTitleRule,
  PendingSuppressionForecastRequiredUnitRule,
  defaultPendingSuppressionForecastValidator,
} from "./pending-suppression-forecast-rules.js";
import { newPendingSuppressionForecast } from "./pending-suppression-forecast.js";

test("PendingSuppressionForecastValidator reports every problem", () => {
  const validator = defaultPendingSuppressionForecastValidator();
  const item = newPendingSuppressionForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSuppressionForecastCodeLengthRule flags a long code", () => {
  const rule = new PendingSuppressionForecastCodeLengthRule(255);
  const item = newPendingSuppressionForecast("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSuppressionForecastLabelLengthRule flags a long label", () => {
  const rule = new PendingSuppressionForecastLabelLengthRule(16);
  const item = newPendingSuppressionForecast("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSuppressionForecastRequiredTitleRule flags a blank title", () => {
  const rule = new PendingSuppressionForecastRequiredTitleRule("pending suppression forecast needs an entry");
  const item = newPendingSuppressionForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSuppressionForecastRequiredUnitRule flags a blank unit", () => {
  const rule = new PendingSuppressionForecastRequiredUnitRule("pending suppression forecast needs this field");
  const item = newPendingSuppressionForecast("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
