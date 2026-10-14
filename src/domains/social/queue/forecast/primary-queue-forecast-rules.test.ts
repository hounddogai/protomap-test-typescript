import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryQueueForecastCohortLengthRule,
  PrimaryQueueForecastLocaleLengthRule,
  PrimaryQueueForecastRequiredCodeRule,
  PrimaryQueueForecastRequiredTitleRule,
  PrimaryQueueForecastStartsAtRangeRule,
  PrimaryQueueForecastTitleLengthRule,
  defaultPrimaryQueueForecastValidator,
} from "./primary-queue-forecast-rules.js";
import { newPrimaryQueueForecast } from "./primary-queue-forecast.js";

test("PrimaryQueueForecastValidator reports every problem", () => {
  const validator = defaultPrimaryQueueForecastValidator();
  const item = newPrimaryQueueForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryQueueForecastLocaleLengthRule flags a long locale", () => {
  const rule = new PrimaryQueueForecastLocaleLengthRule(120);
  const item = newPrimaryQueueForecast("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryQueueForecastTitleLengthRule flags a long title", () => {
  const rule = new PrimaryQueueForecastTitleLengthRule(1000);
  const item = newPrimaryQueueForecast("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryQueueForecastRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryQueueForecastRequiredCodeRule("primary queue forecast needs an entry");
  const item = newPrimaryQueueForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryQueueForecastCohortLengthRule flags a long cohort", () => {
  const rule = new PrimaryQueueForecastCohortLengthRule(86400);
  const item = newPrimaryQueueForecast("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryQueueForecastStartsAtRangeRule flags values above starts at", () => {
  const rule = new PrimaryQueueForecastStartsAtRangeRule(32, 3600);
  const item = newPrimaryQueueForecast("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryQueueForecastRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryQueueForecastRequiredTitleRule("primary queue forecast needs an entry");
  const item = newPrimaryQueueForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
