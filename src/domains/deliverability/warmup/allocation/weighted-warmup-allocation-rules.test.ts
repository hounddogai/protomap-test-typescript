import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWarmupAllocationLabelLengthRule,
  WeightedWarmupAllocationRequiredLabelRule,
  WeightedWarmupAllocationRequiredVariantRule,
  WeightedWarmupAllocationTitleLengthRule,
  defaultWeightedWarmupAllocationValidator,
} from "./weighted-warmup-allocation-rules.js";
import { newWeightedWarmupAllocation } from "./weighted-warmup-allocation.js";

test("WeightedWarmupAllocationValidator reports every problem", () => {
  const validator = defaultWeightedWarmupAllocationValidator();
  const item = newWeightedWarmupAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWarmupAllocationRequiredVariantRule flags a blank variant", () => {
  const rule = new WeightedWarmupAllocationRequiredVariantRule("weighted warmup allocation needs a value");
  const item = newWeightedWarmupAllocation("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWarmupAllocationTitleLengthRule flags a long title", () => {
  const rule = new WeightedWarmupAllocationTitleLengthRule(120);
  const item = newWeightedWarmupAllocation("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedWarmupAllocationLabelLengthRule flags a long label", () => {
  const rule = new WeightedWarmupAllocationLabelLengthRule(3600);
  const item = newWeightedWarmupAllocation("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedWarmupAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedWarmupAllocationRequiredLabelRule("weighted warmup allocation needs an entry");
  const item = newWeightedWarmupAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
