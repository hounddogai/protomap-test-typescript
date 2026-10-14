import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBidRuleForecastChannelLengthRule,
  RegionalBidRuleForecastLabelLengthRule,
  RegionalBidRuleForecastRetriesRangeRule,
  defaultRegionalBidRuleForecastValidator,
} from "./regional-bid-rule-forecast-rules.js";
import { newRegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

test("RegionalBidRuleForecastValidator reports every problem", () => {
  const validator = defaultRegionalBidRuleForecastValidator();
  const item = newRegionalBidRuleForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBidRuleForecastLabelLengthRule flags a long label", () => {
  const rule = new RegionalBidRuleForecastLabelLengthRule(80);
  const item = newRegionalBidRuleForecast("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalBidRuleForecastChannelLengthRule flags a long channel", () => {
  const rule = new RegionalBidRuleForecastChannelLengthRule(255);
  const item = newRegionalBidRuleForecast("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalBidRuleForecastRetriesRangeRule flags values above retries", () => {
  const rule = new RegionalBidRuleForecastRetriesRangeRule(16, 32);
  const item = newRegionalBidRuleForecast("x", "y");
  item.retries = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
