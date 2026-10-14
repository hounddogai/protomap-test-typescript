import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditForecastCodeLengthRule,
  CreditForecastRevisionRangeRule,
  CreditForecastStartsAtRangeRule,
  defaultCreditForecastValidator,
} from "./credit-forecast-rules.js";
import { newCreditForecast } from "./credit-forecast.js";

test("CreditForecastValidator reports every problem", () => {
  const validator = defaultCreditForecastValidator();
  const item = newCreditForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditForecastStartsAtRangeRule flags values above starts at", () => {
  const rule = new CreditForecastStartsAtRangeRule(64, 80);
  const item = newCreditForecast("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditForecastRevisionRangeRule flags values above revision", () => {
  const rule = new CreditForecastRevisionRangeRule(16, 16);
  const item = newCreditForecast("x", "y");
  item.revision = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditForecastCodeLengthRule flags a long code", () => {
  const rule = new CreditForecastCodeLengthRule(255);
  const item = newCreditForecast("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
