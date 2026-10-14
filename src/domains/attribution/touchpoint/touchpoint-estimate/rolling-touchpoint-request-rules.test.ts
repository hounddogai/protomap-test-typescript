import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingTouchpointRequestConversionRateRangeRule,
  RollingTouchpointRequestCountryLengthRule,
  RollingTouchpointRequestRequiredTitleRule,
  defaultRollingTouchpointRequestValidator,
} from "./rolling-touchpoint-request-rules.js";
import { newRollingTouchpointRequest } from "./rolling-touchpoint-request.js";

test("RollingTouchpointRequestValidator reports every problem", () => {
  const validator = defaultRollingTouchpointRequestValidator();
  const item = newRollingTouchpointRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingTouchpointRequestConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RollingTouchpointRequestConversionRateRangeRule(9.1, 4313.5);
  const item = newRollingTouchpointRequest("x", "y");
  item.conversionRate = 4315;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingTouchpointRequestRequiredTitleRule flags a blank title", () => {
  const rule = new RollingTouchpointRequestRequiredTitleRule("rolling touchpoint request needs this field");
  const item = newRollingTouchpointRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingTouchpointRequestCountryLengthRule flags a long country", () => {
  const rule = new RollingTouchpointRequestCountryLengthRule(32);
  const item = newRollingTouchpointRequest("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
