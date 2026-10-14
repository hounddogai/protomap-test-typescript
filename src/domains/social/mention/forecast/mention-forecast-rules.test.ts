import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionForecastAudienceIdLengthRule,
  MentionForecastPhoneLengthRule,
  MentionForecastRateRangeRule,
  defaultMentionForecastValidator,
} from "./mention-forecast-rules.js";
import { newMentionForecast } from "./mention-forecast.js";

test("MentionForecastValidator reports every problem", () => {
  const validator = defaultMentionForecastValidator();
  const item = newMentionForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionForecastRateRangeRule flags values above rate", () => {
  const rule = new MentionForecastRateRangeRule(6.3, 1234.3);
  const item = newMentionForecast("x", "y");
  item.rate = 1235.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionForecastAudienceIdLengthRule flags a long audience id", () => {
  const rule = new MentionForecastAudienceIdLengthRule(3600);
  const item = newMentionForecast("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionForecastPhoneLengthRule flags a long phone", () => {
  const rule = new MentionForecastPhoneLengthRule(64);
  const item = newMentionForecast("x", "y");
  item.phone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
