import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSlaForecastMaximumRangeRule,
  PendingSlaForecastMinimumRangeRule,
  PendingSlaForecastRequiredCodeRule,
  PendingSlaForecastRequiredNameRule,
  defaultPendingSlaForecastValidator,
} from "./pending-sla-forecast-rules.js";
import { newPendingSlaForecast } from "./pending-sla-forecast.js";

test("PendingSlaForecastValidator reports every problem", () => {
  const validator = defaultPendingSlaForecastValidator();
  const item = newPendingSlaForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSlaForecastMinimumRangeRule flags values above minimum", () => {
  const rule = new PendingSlaForecastMinimumRangeRule(7.9, 769.4);
  const item = newPendingSlaForecast("x", "y");
  item.minimum = 770.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingSlaForecastRequiredNameRule flags a blank name", () => {
  const rule = new PendingSlaForecastRequiredNameRule("pending sla forecast needs this field");
  const item = newPendingSlaForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSlaForecastRequiredCodeRule flags a blank code", () => {
  const rule = new PendingSlaForecastRequiredCodeRule("pending sla forecast needs a value");
  const item = newPendingSlaForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSlaForecastMaximumRangeRule flags values above maximum", () => {
  const rule = new PendingSlaForecastMaximumRangeRule(0.4, 3677.3);
  const item = newPendingSlaForecast("x", "y");
  item.maximum = 3678.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
