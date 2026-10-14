import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeForecastCodeLengthRule,
  BadgeForecastRequiredAudienceIdRule,
  BadgeForecastRequiredCodeRule,
  BadgeForecastRequiredLabelRule,
  BadgeForecastRequiredUnitRule,
  BadgeForecastUnitLengthRule,
  defaultBadgeForecastValidator,
} from "./badge-forecast-rules.js";
import { newBadgeForecast } from "./badge-forecast.js";

test("BadgeForecastValidator reports every problem", () => {
  const validator = defaultBadgeForecastValidator();
  const item = newBadgeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeForecastCodeLengthRule flags a long code", () => {
  const rule = new BadgeForecastCodeLengthRule(86400);
  const item = newBadgeForecast("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeForecastRequiredUnitRule flags a blank unit", () => {
  const rule = new BadgeForecastRequiredUnitRule("badge forecast needs a value");
  const item = newBadgeForecast("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeForecastRequiredLabelRule flags a blank label", () => {
  const rule = new BadgeForecastRequiredLabelRule("badge forecast needs an entry");
  const item = newBadgeForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeForecastUnitLengthRule flags a long unit", () => {
  const rule = new BadgeForecastUnitLengthRule(32);
  const item = newBadgeForecast("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeForecastRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeForecastRequiredCodeRule("badge forecast needs this field");
  const item = newBadgeForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeForecastRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new BadgeForecastRequiredAudienceIdRule("badge forecast needs a value");
  const item = newBadgeForecast("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
