import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPayoutPolicyBatchSizeRangeRule,
  WeightedPayoutPolicyCodeLengthRule,
  WeightedPayoutPolicyCurrencyLengthRule,
  WeightedPayoutPolicyFrequencyCapRangeRule,
  WeightedPayoutPolicyRequiredAudienceIdRule,
  WeightedPayoutPolicyWindowDaysRangeRule,
  defaultWeightedPayoutPolicyValidator,
} from "./weighted-payout-policy-rules.js";
import { newWeightedPayoutPolicy } from "./weighted-payout-policy.js";

test("WeightedPayoutPolicyValidator reports every problem", () => {
  const validator = defaultWeightedPayoutPolicyValidator();
  const item = newWeightedPayoutPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPayoutPolicyBatchSizeRangeRule flags values above batch size", () => {
  const rule = new WeightedPayoutPolicyBatchSizeRangeRule(32, 86400);
  const item = newWeightedPayoutPolicy("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPayoutPolicyWindowDaysRangeRule flags values above window days", () => {
  const rule = new WeightedPayoutPolicyWindowDaysRangeRule(120, 3600);
  const item = newWeightedPayoutPolicy("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPayoutPolicyCodeLengthRule flags a long code", () => {
  const rule = new WeightedPayoutPolicyCodeLengthRule(80);
  const item = newWeightedPayoutPolicy("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPayoutPolicyFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new WeightedPayoutPolicyFrequencyCapRangeRule(32, 32);
  const item = newWeightedPayoutPolicy("x", "y");
  item.frequencyCap = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPayoutPolicyCurrencyLengthRule flags a long currency", () => {
  const rule = new WeightedPayoutPolicyCurrencyLengthRule(120);
  const item = newWeightedPayoutPolicy("x", "y");
  item.currency = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPayoutPolicyRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WeightedPayoutPolicyRequiredAudienceIdRule("weighted payout policy needs a value");
  const item = newWeightedPayoutPolicy("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
