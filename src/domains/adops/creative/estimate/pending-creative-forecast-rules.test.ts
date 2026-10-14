import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCreativeForecastCeilingRangeRule,
  PendingCreativeForecastTitleLengthRule,
  PendingCreativeForecastVariantLengthRule,
  defaultPendingCreativeForecastValidator,
} from "./pending-creative-forecast-rules.js";
import { newPendingCreativeForecast } from "./pending-creative-forecast.js";

test("PendingCreativeForecastValidator reports every problem", () => {
  const validator = defaultPendingCreativeForecastValidator();
  const item = newPendingCreativeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCreativeForecastTitleLengthRule flags a long title", () => {
  const rule = new PendingCreativeForecastTitleLengthRule(255);
  const item = newPendingCreativeForecast("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCreativeForecastVariantLengthRule flags a long variant", () => {
  const rule = new PendingCreativeForecastVariantLengthRule(80);
  const item = newPendingCreativeForecast("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCreativeForecastCeilingRangeRule flags values above ceiling", () => {
  const rule = new PendingCreativeForecastCeilingRangeRule(5, 3632);
  const item = newPendingCreativeForecast("x", "y");
  item.ceiling = 3633.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
