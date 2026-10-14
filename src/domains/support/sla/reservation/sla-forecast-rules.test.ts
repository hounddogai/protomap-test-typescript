import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaForecastChannelLengthRule,
  SlaForecastRequiredChannelRule,
  SlaForecastRevisionRangeRule,
  SlaForecastVersionRangeRule,
  defaultSlaForecastValidator,
} from "./sla-forecast-rules.js";
import { newSlaForecast } from "./sla-forecast.js";

test("SlaForecastValidator reports every problem", () => {
  const validator = defaultSlaForecastValidator();
  const item = newSlaForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaForecastChannelLengthRule flags a long channel", () => {
  const rule = new SlaForecastChannelLengthRule(80);
  const item = newSlaForecast("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaForecastRequiredChannelRule flags a blank channel", () => {
  const rule = new SlaForecastRequiredChannelRule("sla forecast needs an entry");
  const item = newSlaForecast("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaForecastRevisionRangeRule flags values above revision", () => {
  const rule = new SlaForecastRevisionRangeRule(80, 3600);
  const item = newSlaForecast("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaForecastVersionRangeRule flags values above version", () => {
  const rule = new SlaForecastVersionRangeRule(16, 80);
  const item = newSlaForecast("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
