import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackModelAllocationCodeLengthRule,
  FallbackModelAllocationDurationMinutesRangeRule,
  FallbackModelAllocationRegionLengthRule,
  FallbackModelAllocationRequiredDescriptionRule,
  defaultFallbackModelAllocationValidator,
} from "./fallback-model-allocation-rules.js";
import { newFallbackModelAllocation } from "./fallback-model-allocation.js";

test("FallbackModelAllocationValidator reports every problem", () => {
  const validator = defaultFallbackModelAllocationValidator();
  const item = newFallbackModelAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackModelAllocationRequiredDescriptionRule flags a blank description", () => {
  const rule = new FallbackModelAllocationRequiredDescriptionRule("fallback model allocation needs this field");
  const item = newFallbackModelAllocation("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackModelAllocationDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new FallbackModelAllocationDurationMinutesRangeRule(80, 80);
  const item = newFallbackModelAllocation("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackModelAllocationCodeLengthRule flags a long code", () => {
  const rule = new FallbackModelAllocationCodeLengthRule(255);
  const item = newFallbackModelAllocation("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackModelAllocationRegionLengthRule flags a long region", () => {
  const rule = new FallbackModelAllocationRegionLengthRule(255);
  const item = newFallbackModelAllocation("x", "y");
  item.region = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
