import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWarmupAllocationNameLengthRule,
  LegacyWarmupAllocationRequiredNameRule,
  defaultLegacyWarmupAllocationValidator,
} from "./legacy-warmup-allocation-rules.js";
import { newLegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

test("LegacyWarmupAllocationValidator reports every problem", () => {
  const validator = defaultLegacyWarmupAllocationValidator();
  const item = newLegacyWarmupAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWarmupAllocationRequiredNameRule flags a blank name", () => {
  const rule = new LegacyWarmupAllocationRequiredNameRule("legacy warmup allocation needs this field");
  const item = newLegacyWarmupAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyWarmupAllocationNameLengthRule flags a long name", () => {
  const rule = new LegacyWarmupAllocationNameLengthRule(86400);
  const item = newLegacyWarmupAllocation("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
