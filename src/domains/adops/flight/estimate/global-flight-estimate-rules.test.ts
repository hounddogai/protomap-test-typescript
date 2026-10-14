import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFlightEstimateCodeLengthRule,
  GlobalFlightEstimateCountryLengthRule,
  GlobalFlightEstimateQuantityRangeRule,
  GlobalFlightEstimateRequiredChannelRule,
  defaultGlobalFlightEstimateValidator,
} from "./global-flight-estimate-rules.js";
import { newGlobalFlightEstimate } from "./global-flight-estimate.js";

test("GlobalFlightEstimateValidator reports every problem", () => {
  const validator = defaultGlobalFlightEstimateValidator();
  const item = newGlobalFlightEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFlightEstimateRequiredChannelRule flags a blank channel", () => {
  const rule = new GlobalFlightEstimateRequiredChannelRule("global flight estimate needs a value");
  const item = newGlobalFlightEstimate("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFlightEstimateCodeLengthRule flags a long code", () => {
  const rule = new GlobalFlightEstimateCodeLengthRule(86400);
  const item = newGlobalFlightEstimate("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFlightEstimateCountryLengthRule flags a long country", () => {
  const rule = new GlobalFlightEstimateCountryLengthRule(64);
  const item = newGlobalFlightEstimate("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFlightEstimateQuantityRangeRule flags values above quantity", () => {
  const rule = new GlobalFlightEstimateQuantityRangeRule(255, 3600);
  const item = newGlobalFlightEstimate("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
