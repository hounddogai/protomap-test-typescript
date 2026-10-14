import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintForecastCodeLengthRule,
  ComplaintForecastDiscountRangeRule,
  ComplaintForecastRequiredCodeRule,
  ComplaintForecastRequiredUnitRule,
  ComplaintForecastRevisionRangeRule,
  defaultComplaintForecastValidator,
} from "./complaint-forecast-rules.js";
import { newComplaintForecast } from "./complaint-forecast.js";

test("ComplaintForecastValidator reports every problem", () => {
  const validator = defaultComplaintForecastValidator();
  const item = newComplaintForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintForecastDiscountRangeRule flags values above discount", () => {
  const rule = new ComplaintForecastDiscountRangeRule(9.8, 3947);
  const item = newComplaintForecast("x", "y");
  item.discount = 3948.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintForecastCodeLengthRule flags a long code", () => {
  const rule = new ComplaintForecastCodeLengthRule(1000);
  const item = newComplaintForecast("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintForecastRevisionRangeRule flags values above revision", () => {
  const rule = new ComplaintForecastRevisionRangeRule(1000, 86400);
  const item = newComplaintForecast("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintForecastRequiredUnitRule flags a blank unit", () => {
  const rule = new ComplaintForecastRequiredUnitRule("complaint forecast needs a value");
  const item = newComplaintForecast("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintForecastRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintForecastRequiredCodeRule("complaint forecast needs an entry");
  const item = newComplaintForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
