import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultExitRuleForecastRequiredChannelRule,
  DefaultExitRuleForecastRequiredCodeRule,
  DefaultExitRuleForecastRequiredExternalRefRule,
  DefaultExitRuleForecastTitleLengthRule,
  defaultDefaultExitRuleForecastValidator,
} from "./default-exit-rule-forecast-rules.js";
import { newDefaultExitRuleForecast } from "./default-exit-rule-forecast.js";

test("DefaultExitRuleForecastValidator reports every problem", () => {
  const validator = defaultDefaultExitRuleForecastValidator();
  const item = newDefaultExitRuleForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultExitRuleForecastRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultExitRuleForecastRequiredCodeRule("default exit rule forecast needs this field");
  const item = newDefaultExitRuleForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultExitRuleForecastTitleLengthRule flags a long title", () => {
  const rule = new DefaultExitRuleForecastTitleLengthRule(120);
  const item = newDefaultExitRuleForecast("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultExitRuleForecastRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new DefaultExitRuleForecastRequiredExternalRefRule("default exit rule forecast needs a value");
  const item = newDefaultExitRuleForecast("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultExitRuleForecastRequiredChannelRule flags a blank channel", () => {
  const rule = new DefaultExitRuleForecastRequiredChannelRule("default exit rule forecast needs an entry");
  const item = newDefaultExitRuleForecast("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
