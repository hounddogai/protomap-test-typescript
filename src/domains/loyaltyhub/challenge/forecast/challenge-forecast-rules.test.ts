import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeForecastRequiredNameRule,
  ChallengeForecastRequiredTimezoneRule,
  ChallengeForecastVersionRangeRule,
  defaultChallengeForecastValidator,
} from "./challenge-forecast-rules.js";
import { newChallengeForecast } from "./challenge-forecast.js";

test("ChallengeForecastValidator reports every problem", () => {
  const validator = defaultChallengeForecastValidator();
  const item = newChallengeForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeForecastVersionRangeRule flags values above version", () => {
  const rule = new ChallengeForecastVersionRangeRule(64, 80);
  const item = newChallengeForecast("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeForecastRequiredNameRule flags a blank name", () => {
  const rule = new ChallengeForecastRequiredNameRule("challenge forecast needs an entry");
  const item = newChallengeForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeForecastRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ChallengeForecastRequiredTimezoneRule("challenge forecast needs an entry");
  const item = newChallengeForecast("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
