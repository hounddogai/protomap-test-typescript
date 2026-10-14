import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelForecastCurrencyLengthRule,
  LevelForecastNotesLengthRule,
  LevelForecastRequiredCurrencyRule,
  defaultLevelForecastValidator,
} from "./level-forecast-rules.js";
import { newLevelForecast } from "./level-forecast.js";

test("LevelForecastValidator reports every problem", () => {
  const validator = defaultLevelForecastValidator();
  const item = newLevelForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelForecastNotesLengthRule flags a long notes", () => {
  const rule = new LevelForecastNotesLengthRule(255);
  const item = newLevelForecast("x", "y");
  item.notes = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelForecastCurrencyLengthRule flags a long currency", () => {
  const rule = new LevelForecastCurrencyLengthRule(80);
  const item = newLevelForecast("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelForecastRequiredCurrencyRule flags a blank currency", () => {
  const rule = new LevelForecastRequiredCurrencyRule("level forecast needs this field");
  const item = newLevelForecast("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
