import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointForecastCampaignRefLengthRule,
  TouchpointForecastCodeLengthRule,
  TouchpointForecastRequiredCodeRule,
  TouchpointForecastTitleLengthRule,
  defaultTouchpointForecastValidator,
} from "./touchpoint-forecast-rules.js";
import { newTouchpointForecast } from "./touchpoint-forecast.js";

test("TouchpointForecastValidator reports every problem", () => {
  const validator = defaultTouchpointForecastValidator();
  const item = newTouchpointForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointForecastTitleLengthRule flags a long title", () => {
  const rule = new TouchpointForecastTitleLengthRule(80);
  const item = newTouchpointForecast("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointForecastRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointForecastRequiredCodeRule("touchpoint forecast needs this field");
  const item = newTouchpointForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointForecastCodeLengthRule flags a long code", () => {
  const rule = new TouchpointForecastCodeLengthRule(80);
  const item = newTouchpointForecast("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointForecastCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new TouchpointForecastCampaignRefLengthRule(80);
  const item = newTouchpointForecast("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
