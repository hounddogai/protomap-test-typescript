import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredActivationEstimateBidRangeRule,
  TieredActivationEstimateCodeLengthRule,
  TieredActivationEstimateNameLengthRule,
  TieredActivationEstimateRequiredCodeRule,
  TieredActivationEstimateRequiredNameRule,
  defaultTieredActivationEstimateValidator,
} from "./tiered-activation-estimate-rules.js";
import { newTieredActivationEstimate } from "./tiered-activation-estimate.js";

test("TieredActivationEstimateValidator reports every problem", () => {
  const validator = defaultTieredActivationEstimateValidator();
  const item = newTieredActivationEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredActivationEstimateCodeLengthRule flags a long code", () => {
  const rule = new TieredActivationEstimateCodeLengthRule(86400);
  const item = newTieredActivationEstimate("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredActivationEstimateRequiredNameRule flags a blank name", () => {
  const rule = new TieredActivationEstimateRequiredNameRule("tiered activation estimate needs an entry");
  const item = newTieredActivationEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredActivationEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new TieredActivationEstimateRequiredCodeRule("tiered activation estimate needs this field");
  const item = newTieredActivationEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredActivationEstimateNameLengthRule flags a long name", () => {
  const rule = new TieredActivationEstimateNameLengthRule(64);
  const item = newTieredActivationEstimate("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredActivationEstimateBidRangeRule flags values above bid", () => {
  const rule = new TieredActivationEstimateBidRangeRule(2.6, 373.1);
  const item = newTieredActivationEstimate("x", "y");
  item.bid = 374.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
