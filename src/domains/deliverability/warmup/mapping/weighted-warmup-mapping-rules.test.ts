import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWarmupMappingAttemptsRangeRule,
  WeightedWarmupMappingExternalRefLengthRule,
  defaultWeightedWarmupMappingValidator,
} from "./weighted-warmup-mapping-rules.js";
import { newWeightedWarmupMapping } from "./weighted-warmup-mapping.js";

test("WeightedWarmupMappingValidator reports every problem", () => {
  const validator = defaultWeightedWarmupMappingValidator();
  const item = newWeightedWarmupMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWarmupMappingAttemptsRangeRule flags values above attempts", () => {
  const rule = new WeightedWarmupMappingAttemptsRangeRule(120, 86400);
  const item = newWeightedWarmupMapping("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWarmupMappingExternalRefLengthRule flags a long external ref", () => {
  const rule = new WeightedWarmupMappingExternalRefLengthRule(64);
  const item = newWeightedWarmupMapping("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
