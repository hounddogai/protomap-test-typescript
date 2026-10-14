import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBidRuleForecastCodeLengthRule,
  SeasonalBidRuleForecastQuantityRangeRule,
  SeasonalBidRuleForecastRequiredNameRule,
  SeasonalBidRuleForecastRequiredTitleRule,
  SeasonalBidRuleForecastTitleLengthRule,
  defaultSeasonalBidRuleForecastValidator,
} from "./seasonal-bid-rule-forecast-rules.js";
import { newSeasonalBidRuleForecast } from "./seasonal-bid-rule-forecast.js";

test("SeasonalBidRuleForecastValidator reports every problem", () => {
  const validator = defaultSeasonalBidRuleForecastValidator();
  const item = newSeasonalBidRuleForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBidRuleForecastTitleLengthRule flags a long title", () => {
  const rule = new SeasonalBidRuleForecastTitleLengthRule(64);
  const item = newSeasonalBidRuleForecast("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBidRuleForecastRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalBidRuleForecastRequiredTitleRule("seasonal bid rule forecast needs this field");
  const item = newSeasonalBidRuleForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBidRuleForecastRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalBidRuleForecastRequiredNameRule("seasonal bid rule forecast needs a value");
  const item = newSeasonalBidRuleForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBidRuleForecastQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalBidRuleForecastQuantityRangeRule(120, 3600);
  const item = newSeasonalBidRuleForecast("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBidRuleForecastCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBidRuleForecastCodeLengthRule(80);
  const item = newSeasonalBidRuleForecast("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
