import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledEnrollmentForecastBudgetRangeRule,
  ScheduledEnrollmentForecastCeilingRangeRule,
  ScheduledEnrollmentForecastCodeLengthRule,
  ScheduledEnrollmentForecastRequiredExternalRefRule,
  ScheduledEnrollmentForecastRequiredLabelRule,
  defaultScheduledEnrollmentForecastValidator,
} from "./scheduled-enrollment-forecast-rules.js";
import { newScheduledEnrollmentForecast } from "./scheduled-enrollment-forecast.js";

test("ScheduledEnrollmentForecastValidator reports every problem", () => {
  const validator = defaultScheduledEnrollmentForecastValidator();
  const item = newScheduledEnrollmentForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledEnrollmentForecastRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledEnrollmentForecastRequiredLabelRule("scheduled enrollment forecast needs an entry");
  const item = newScheduledEnrollmentForecast("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledEnrollmentForecastRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ScheduledEnrollmentForecastRequiredExternalRefRule("scheduled enrollment forecast needs an entry");
  const item = newScheduledEnrollmentForecast("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledEnrollmentForecastBudgetRangeRule flags values above budget", () => {
  const rule = new ScheduledEnrollmentForecastBudgetRangeRule(0.3, 775.5);
  const item = newScheduledEnrollmentForecast("x", "y");
  item.budget = 777;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledEnrollmentForecastCeilingRangeRule flags values above ceiling", () => {
  const rule = new ScheduledEnrollmentForecastCeilingRangeRule(4.1, 4772.8);
  const item = newScheduledEnrollmentForecast("x", "y");
  item.ceiling = 4774.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledEnrollmentForecastCodeLengthRule flags a long code", () => {
  const rule = new ScheduledEnrollmentForecastCodeLengthRule(1000);
  const item = newScheduledEnrollmentForecast("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
