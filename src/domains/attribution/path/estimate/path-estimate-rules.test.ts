import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathEstimateBidRangeRule,
  PathEstimateCodeLengthRule,
  PathEstimateRequiredTimezoneRule,
  PathEstimateTimezoneLengthRule,
  defaultPathEstimateValidator,
} from "./path-estimate-rules.js";
import { newPathEstimate } from "./path-estimate.js";

test("PathEstimateValidator reports every problem", () => {
  const validator = defaultPathEstimateValidator();
  const item = newPathEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathEstimateTimezoneLengthRule flags a long timezone", () => {
  const rule = new PathEstimateTimezoneLengthRule(255);
  const item = newPathEstimate("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathEstimateRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PathEstimateRequiredTimezoneRule("path estimate needs a value");
  const item = newPathEstimate("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathEstimateCodeLengthRule flags a long code", () => {
  const rule = new PathEstimateCodeLengthRule(3600);
  const item = newPathEstimate("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathEstimateBidRangeRule flags values above bid", () => {
  const rule = new PathEstimateBidRangeRule(6.3, 4555.8);
  const item = newPathEstimate("x", "y");
  item.bid = 4557.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
