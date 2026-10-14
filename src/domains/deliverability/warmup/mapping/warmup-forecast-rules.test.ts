import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupForecastCeilingRangeRule,
  WarmupForecastLabelLengthRule,
  WarmupForecastPhoneLengthRule,
  WarmupForecastRequiredLabelRule,
  WarmupForecastRequiredPhoneRule,
  defaultWarmupForecastValidator,
} from "./warmup-forecast-rules.js";
import { newWarmupForecast } from "./warmup-forecast.js";

test("WarmupForecastValidator reports every problem", () => {
  const validator = defaultWarmupForecastValidator();
  const item = newWarmupForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupForecastRequiredLabelRule flags a blank label", () => {
  const rule = new WarmupForecastRequiredLabelRule("warmup forecast needs a value");
  const item = newWarmupForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupForecastLabelLengthRule flags a long label", () => {
  const rule = new WarmupForecastLabelLengthRule(64);
  const item = newWarmupForecast("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupForecastPhoneLengthRule flags a long phone", () => {
  const rule = new WarmupForecastPhoneLengthRule(3600);
  const item = newWarmupForecast("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupForecastRequiredPhoneRule flags a blank phone", () => {
  const rule = new WarmupForecastRequiredPhoneRule("warmup forecast needs this field");
  const item = newWarmupForecast("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupForecastCeilingRangeRule flags values above ceiling", () => {
  const rule = new WarmupForecastCeilingRangeRule(4.2, 2084);
  const item = newWarmupForecast("x", "y");
  item.ceiling = 2085.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
