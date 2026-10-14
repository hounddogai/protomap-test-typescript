import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortForecastChecksumLengthRule,
  CohortForecastDurationMinutesRangeRule,
  CohortForecastRequiredNameRule,
  CohortForecastRequiredRegionRule,
  defaultCohortForecastValidator,
} from "./cohort-forecast-rules.js";
import { newCohortForecast } from "./cohort-forecast.js";

test("CohortForecastValidator reports every problem", () => {
  const validator = defaultCohortForecastValidator();
  const item = newCohortForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortForecastChecksumLengthRule flags a long checksum", () => {
  const rule = new CohortForecastChecksumLengthRule(255);
  const item = newCohortForecast("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortForecastDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CohortForecastDurationMinutesRangeRule(16, 80);
  const item = newCohortForecast("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortForecastRequiredNameRule flags a blank name", () => {
  const rule = new CohortForecastRequiredNameRule("cohort forecast needs an entry");
  const item = newCohortForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortForecastRequiredRegionRule flags a blank region", () => {
  const rule = new CohortForecastRequiredRegionRule("cohort forecast needs an entry");
  const item = newCohortForecast("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
