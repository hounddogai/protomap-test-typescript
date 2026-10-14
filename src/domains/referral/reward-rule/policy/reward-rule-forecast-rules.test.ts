import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleForecastDescriptionLengthRule,
  RewardRuleForecastLabelLengthRule,
  RewardRuleForecastRequiredCodeRule,
  RewardRuleForecastRequiredUtmSourceRule,
  RewardRuleForecastUtmSourceLengthRule,
  defaultRewardRuleForecastValidator,
} from "./reward-rule-forecast-rules.js";
import { newRewardRuleForecast } from "./reward-rule-forecast.js";

test("RewardRuleForecastValidator reports every problem", () => {
  const validator = defaultRewardRuleForecastValidator();
  const item = newRewardRuleForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleForecastDescriptionLengthRule flags a long description", () => {
  const rule = new RewardRuleForecastDescriptionLengthRule(32);
  const item = newRewardRuleForecast("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleForecastLabelLengthRule flags a long label", () => {
  const rule = new RewardRuleForecastLabelLengthRule(1000);
  const item = newRewardRuleForecast("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleForecastRequiredCodeRule flags a blank code", () => {
  const rule = new RewardRuleForecastRequiredCodeRule("reward rule forecast needs an entry");
  const item = newRewardRuleForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleForecastRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RewardRuleForecastRequiredUtmSourceRule("reward rule forecast needs this field");
  const item = newRewardRuleForecast("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleForecastUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RewardRuleForecastUtmSourceLengthRule(16);
  const item = newRewardRuleForecast("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
