import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteForecastRequiredCodeRule,
  InviteForecastRequiredReviewerRule,
  InviteForecastReviewerLengthRule,
  defaultInviteForecastValidator,
} from "./invite-forecast-rules.js";
import { newInviteForecast } from "./invite-forecast.js";

test("InviteForecastValidator reports every problem", () => {
  const validator = defaultInviteForecastValidator();
  const item = newInviteForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteForecastRequiredCodeRule flags a blank code", () => {
  const rule = new InviteForecastRequiredCodeRule("invite forecast needs a value");
  const item = newInviteForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteForecastRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new InviteForecastRequiredReviewerRule("invite forecast needs a value");
  const item = newInviteForecast("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteForecastReviewerLengthRule flags a long reviewer", () => {
  const rule = new InviteForecastReviewerLengthRule(64);
  const item = newInviteForecast("x", "y");
  item.reviewer = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
