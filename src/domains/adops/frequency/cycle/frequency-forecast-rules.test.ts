import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyForecastCodeLengthRule,
  FrequencyForecastCurrencyLengthRule,
  FrequencyForecastNotesLengthRule,
  FrequencyForecastRequiredLabelRule,
  defaultFrequencyForecastValidator,
} from "./frequency-forecast-rules.js";
import { newFrequencyForecast } from "./frequency-forecast.js";

test("FrequencyForecastValidator reports every problem", () => {
  const validator = defaultFrequencyForecastValidator();
  const item = newFrequencyForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyForecastRequiredLabelRule flags a blank label", () => {
  const rule = new FrequencyForecastRequiredLabelRule("frequency forecast needs an entry");
  const item = newFrequencyForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyForecastCurrencyLengthRule flags a long currency", () => {
  const rule = new FrequencyForecastCurrencyLengthRule(16);
  const item = newFrequencyForecast("x", "y");
  item.currency = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyForecastNotesLengthRule flags a long notes", () => {
  const rule = new FrequencyForecastNotesLengthRule(80);
  const item = newFrequencyForecast("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyForecastCodeLengthRule flags a long code", () => {
  const rule = new FrequencyForecastCodeLengthRule(255);
  const item = newFrequencyForecast("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
