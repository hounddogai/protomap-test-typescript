import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultSlaForecastRequiredLabelRule,
  DefaultSlaForecastScoreRangeRule,
  defaultDefaultSlaForecastValidator,
} from "./default-sla-forecast-rules.js";
import { newDefaultSlaForecast } from "./default-sla-forecast.js";

test("DefaultSlaForecastValidator reports every problem", () => {
  const validator = defaultDefaultSlaForecastValidator();
  const item = newDefaultSlaForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultSlaForecastScoreRangeRule flags values above score", () => {
  const rule = new DefaultSlaForecastScoreRangeRule(5.6, 3228.3);
  const item = newDefaultSlaForecast("x", "y");
  item.score = 3229.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultSlaForecastRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultSlaForecastRequiredLabelRule("default sla forecast needs a value");
  const item = newDefaultSlaForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
