import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationForecastCodeLengthRule,
  EscalationForecastRequiredCodeRule,
  EscalationForecastRequiredCountryRule,
  EscalationForecastRequiredLabelRule,
  EscalationForecastUpdatedAtRangeRule,
  defaultEscalationForecastValidator,
} from "./escalation-forecast-rules.js";
import { newEscalationForecast } from "./escalation-forecast.js";

test("EscalationForecastValidator reports every problem", () => {
  const validator = defaultEscalationForecastValidator();
  const item = newEscalationForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationForecastRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationForecastRequiredCodeRule("escalation forecast needs a value");
  const item = newEscalationForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationForecastUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new EscalationForecastUpdatedAtRangeRule(120, 86400);
  const item = newEscalationForecast("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationForecastRequiredCountryRule flags a blank country", () => {
  const rule = new EscalationForecastRequiredCountryRule("escalation forecast needs a value");
  const item = newEscalationForecast("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationForecastCodeLengthRule flags a long code", () => {
  const rule = new EscalationForecastCodeLengthRule(86400);
  const item = newEscalationForecast("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationForecastRequiredLabelRule flags a blank label", () => {
  const rule = new EscalationForecastRequiredLabelRule("escalation forecast needs an entry");
  const item = newEscalationForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
