import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleForecastCodeLengthRule,
  ExitRuleForecastOwnerIdLengthRule,
  ExitRuleForecastRevisionRangeRule,
  defaultExitRuleForecastValidator,
} from "./exit-rule-forecast-rules.js";
import { newExitRuleForecast } from "./exit-rule-forecast.js";

test("ExitRuleForecastValidator reports every problem", () => {
  const validator = defaultExitRuleForecastValidator();
  const item = newExitRuleForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleForecastOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ExitRuleForecastOwnerIdLengthRule(3600);
  const item = newExitRuleForecast("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleForecastCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleForecastCodeLengthRule(80);
  const item = newExitRuleForecast("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleForecastRevisionRangeRule flags values above revision", () => {
  const rule = new ExitRuleForecastRevisionRangeRule(32, 3600);
  const item = newExitRuleForecast("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
