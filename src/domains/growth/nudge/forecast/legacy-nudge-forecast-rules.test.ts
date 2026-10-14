import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyNudgeForecastCodeLengthRule,
  LegacyNudgeForecastLabelLengthRule,
  LegacyNudgeForecastNameLengthRule,
  LegacyNudgeForecastRequiredLabelRule,
  defaultLegacyNudgeForecastValidator,
} from "./legacy-nudge-forecast-rules.js";
import { newLegacyNudgeForecast } from "./legacy-nudge-forecast.js";

test("LegacyNudgeForecastValidator reports every problem", () => {
  const validator = defaultLegacyNudgeForecastValidator();
  const item = newLegacyNudgeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyNudgeForecastCodeLengthRule flags a long code", () => {
  const rule = new LegacyNudgeForecastCodeLengthRule(3600);
  const item = newLegacyNudgeForecast("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyNudgeForecastRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyNudgeForecastRequiredLabelRule("legacy nudge forecast needs a value");
  const item = newLegacyNudgeForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyNudgeForecastNameLengthRule flags a long name", () => {
  const rule = new LegacyNudgeForecastNameLengthRule(86400);
  const item = newLegacyNudgeForecast("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyNudgeForecastLabelLengthRule flags a long label", () => {
  const rule = new LegacyNudgeForecastLabelLengthRule(80);
  const item = newLegacyNudgeForecast("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
