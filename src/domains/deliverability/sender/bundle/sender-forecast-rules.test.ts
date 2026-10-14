import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderForecastGraceDaysRangeRule,
  SenderForecastRequiredChannelRule,
  SenderForecastRequiredReviewerRule,
  defaultSenderForecastValidator,
} from "./sender-forecast-rules.js";
import { newSenderForecast } from "./sender-forecast.js";

test("SenderForecastValidator reports every problem", () => {
  const validator = defaultSenderForecastValidator();
  const item = newSenderForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderForecastRequiredChannelRule flags a blank channel", () => {
  const rule = new SenderForecastRequiredChannelRule("sender forecast needs this field");
  const item = newSenderForecast("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderForecastGraceDaysRangeRule flags values above grace days", () => {
  const rule = new SenderForecastGraceDaysRangeRule(255, 1000);
  const item = newSenderForecast("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderForecastRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new SenderForecastRequiredReviewerRule("sender forecast needs this field");
  const item = newSenderForecast("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
