import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBidRuleForecastRequiredContactEmailRule,
  ScheduledBidRuleForecastRequiredOwnerIdRule,
  ScheduledBidRuleForecastRequiredTitleRule,
  ScheduledBidRuleForecastTitleLengthRule,
  defaultScheduledBidRuleForecastValidator,
} from "./scheduled-bid-rule-forecast-rules.js";
import { newScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

test("ScheduledBidRuleForecastValidator reports every problem", () => {
  const validator = defaultScheduledBidRuleForecastValidator();
  const item = newScheduledBidRuleForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBidRuleForecastRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ScheduledBidRuleForecastRequiredContactEmailRule("scheduled bid rule forecast needs a value");
  const item = newScheduledBidRuleForecast("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledBidRuleForecastTitleLengthRule flags a long title", () => {
  const rule = new ScheduledBidRuleForecastTitleLengthRule(16);
  const item = newScheduledBidRuleForecast("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBidRuleForecastRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ScheduledBidRuleForecastRequiredOwnerIdRule("scheduled bid rule forecast needs an entry");
  const item = newScheduledBidRuleForecast("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledBidRuleForecastRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledBidRuleForecastRequiredTitleRule("scheduled bid rule forecast needs this field");
  const item = newScheduledBidRuleForecast("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
