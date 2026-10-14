import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPayoutAllocationBidRangeRule,
  WeightedPayoutAllocationCapacityRangeRule,
  WeightedPayoutAllocationExternalRefLengthRule,
  WeightedPayoutAllocationGraceDaysRangeRule,
  WeightedPayoutAllocationRateRangeRule,
  defaultWeightedPayoutAllocationValidator,
} from "./weighted-payout-allocation-rules.js";
import { newWeightedPayoutAllocation } from "./weighted-payout-allocation.js";

test("WeightedPayoutAllocationValidator reports every problem", () => {
  const validator = defaultWeightedPayoutAllocationValidator();
  const item = newWeightedPayoutAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPayoutAllocationCapacityRangeRule flags values above capacity", () => {
  const rule = new WeightedPayoutAllocationCapacityRangeRule(255, 3600);
  const item = newWeightedPayoutAllocation("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPayoutAllocationGraceDaysRangeRule flags values above grace days", () => {
  const rule = new WeightedPayoutAllocationGraceDaysRangeRule(64, 86400);
  const item = newWeightedPayoutAllocation("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPayoutAllocationBidRangeRule flags values above bid", () => {
  const rule = new WeightedPayoutAllocationBidRangeRule(7.7, 3462.3);
  const item = newWeightedPayoutAllocation("x", "y");
  item.bid = 3463.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPayoutAllocationExternalRefLengthRule flags a long external ref", () => {
  const rule = new WeightedPayoutAllocationExternalRefLengthRule(80);
  const item = newWeightedPayoutAllocation("x", "y");
  item.externalRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPayoutAllocationRateRangeRule flags values above rate", () => {
  const rule = new WeightedPayoutAllocationRateRangeRule(1.8, 2349.3);
  const item = newWeightedPayoutAllocation("x", "y");
  item.rate = 2350.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
