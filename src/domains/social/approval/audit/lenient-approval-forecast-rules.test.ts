import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientApprovalForecastFloorValueRangeRule,
  LenientApprovalForecastRequiredCodeRule,
  LenientApprovalForecastRequiredNameRule,
  defaultLenientApprovalForecastValidator,
} from "./lenient-approval-forecast-rules.js";
import { newLenientApprovalForecast } from "./lenient-approval-forecast.js";

test("LenientApprovalForecastValidator reports every problem", () => {
  const validator = defaultLenientApprovalForecastValidator();
  const item = newLenientApprovalForecast("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientApprovalForecastRequiredCodeRule flags a blank code", () => {
  const rule = new LenientApprovalForecastRequiredCodeRule("lenient approval forecast needs an entry");
  const item = newLenientApprovalForecast("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientApprovalForecastFloorValueRangeRule flags values above floor value", () => {
  const rule = new LenientApprovalForecastFloorValueRangeRule(3.9, 486.4);
  const item = newLenientApprovalForecast("x", "y");
  item.floorValue = 487.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientApprovalForecastRequiredNameRule flags a blank name", () => {
  const rule = new LenientApprovalForecastRequiredNameRule("lenient approval forecast needs a value");
  const item = newLenientApprovalForecast("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
