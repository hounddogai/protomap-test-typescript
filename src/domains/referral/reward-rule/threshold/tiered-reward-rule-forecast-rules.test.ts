import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardRuleForecastDiscountRangeRule,
  TieredRewardRuleForecastRatioRangeRule,
  TieredRewardRuleForecastRequiredCodeRule,
  TieredRewardRuleForecastRequiredNotesRule,
  TieredRewardRuleForecastRequiredTitleRule,
  TieredRewardRuleForecastTitleLengthRule,
  defaultTieredRewardRuleForecastValidator,
} from "./tiered-reward-rule-forecast-rules.js";
import { newTieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

test("TieredRewardRuleForecastValidator reports every problem", () => {
  const validator = defaultTieredRewardRuleForecastValidator();
  const item = newTieredRewardRuleForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardRuleForecastTitleLengthRule flags a long title", () => {
  const rule = new TieredRewardRuleForecastTitleLengthRule(3600);
  const item = newTieredRewardRuleForecast("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRewardRuleForecastDiscountRangeRule flags values above discount", () => {
  const rule = new TieredRewardRuleForecastDiscountRangeRule(8.2, 4179.5);
  const item = newTieredRewardRuleForecast("x", "y");
  item.discount = 4181;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRewardRuleForecastRequiredCodeRule flags a blank code", () => {
  const rule = new TieredRewardRuleForecastRequiredCodeRule("tiered reward rule forecast needs this field");
  const item = newTieredRewardRuleForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleForecastRatioRangeRule flags values above ratio", () => {
  const rule = new TieredRewardRuleForecastRatioRangeRule(8.7, 4118.6);
  const item = newTieredRewardRuleForecast("x", "y");
  item.ratio = 4120.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRewardRuleForecastRequiredTitleRule flags a blank title", () => {
  const rule = new TieredRewardRuleForecastRequiredTitleRule("tiered reward rule forecast needs a value");
  const item = newTieredRewardRuleForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleForecastRequiredNotesRule flags a blank notes", () => {
  const rule = new TieredRewardRuleForecastRequiredNotesRule("tiered reward rule forecast needs an entry");
  const item = newTieredRewardRuleForecast("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
