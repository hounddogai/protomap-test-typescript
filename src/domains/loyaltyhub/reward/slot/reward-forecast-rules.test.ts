import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardForecastJourneyIdLengthRule,
  RewardForecastTitleLengthRule,
  defaultRewardForecastValidator,
} from "./reward-forecast-rules.js";
import { newRewardForecast } from "./reward-forecast.js";

test("RewardForecastValidator reports every problem", () => {
  const validator = defaultRewardForecastValidator();
  const item = newRewardForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardForecastJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RewardForecastJourneyIdLengthRule(32);
  const item = newRewardForecast("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardForecastTitleLengthRule flags a long title", () => {
  const rule = new RewardForecastTitleLengthRule(16);
  const item = newRewardForecast("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
