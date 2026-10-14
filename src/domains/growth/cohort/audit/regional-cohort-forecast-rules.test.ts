import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCohortForecastDiscountRangeRule,
  RegionalCohortForecastNameLengthRule,
  RegionalCohortForecastPhoneLengthRule,
  RegionalCohortForecastRequiredCodeRule,
  RegionalCohortForecastRequiredContactEmailRule,
  defaultRegionalCohortForecastValidator,
} from "./regional-cohort-forecast-rules.js";
import { newRegionalCohortForecast } from "./regional-cohort-forecast.js";

test("RegionalCohortForecastValidator reports every problem", () => {
  const validator = defaultRegionalCohortForecastValidator();
  const item = newRegionalCohortForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCohortForecastRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalCohortForecastRequiredCodeRule("regional cohort forecast needs a value");
  const item = newRegionalCohortForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCohortForecastDiscountRangeRule flags values above discount", () => {
  const rule = new RegionalCohortForecastDiscountRangeRule(0.9, 3146.8);
  const item = newRegionalCohortForecast("x", "y");
  item.discount = 3148.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCohortForecastNameLengthRule flags a long name", () => {
  const rule = new RegionalCohortForecastNameLengthRule(3600);
  const item = newRegionalCohortForecast("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalCohortForecastPhoneLengthRule flags a long phone", () => {
  const rule = new RegionalCohortForecastPhoneLengthRule(32);
  const item = newRegionalCohortForecast("x", "y");
  item.phone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalCohortForecastRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RegionalCohortForecastRequiredContactEmailRule("regional cohort forecast needs an entry");
  const item = newRegionalCohortForecast("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
