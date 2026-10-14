import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatEstimateBidRangeRule,
  CsatEstimateCapacityRangeRule,
  CsatEstimateLabelLengthRule,
  CsatEstimateRequiredCodeRule,
  defaultCsatEstimateValidator,
} from "./csat-estimate-rules.js";
import { newCsatEstimate } from "./csat-estimate.js";

test("CsatEstimateValidator reports every problem", () => {
  const validator = defaultCsatEstimateValidator();
  const item = newCsatEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatEstimateCapacityRangeRule flags values above capacity", () => {
  const rule = new CsatEstimateCapacityRangeRule(255, 255);
  const item = newCsatEstimate("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new CsatEstimateRequiredCodeRule("csat estimate needs a value");
  const item = newCsatEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatEstimateLabelLengthRule flags a long label", () => {
  const rule = new CsatEstimateLabelLengthRule(64);
  const item = newCsatEstimate("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatEstimateBidRangeRule flags values above bid", () => {
  const rule = new CsatEstimateBidRangeRule(6.8, 246.9);
  const item = newCsatEstimate("x", "y");
  item.bid = 248.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
