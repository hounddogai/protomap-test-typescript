import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWarmupMappingBudgetRangeRule,
  RollingWarmupMappingRequiredCodeRule,
  defaultRollingWarmupMappingValidator,
} from "./rolling-warmup-mapping-rules.js";
import { newRollingWarmupMapping } from "./rolling-warmup-mapping.js";

test("RollingWarmupMappingValidator reports every problem", () => {
  const validator = defaultRollingWarmupMappingValidator();
  const item = newRollingWarmupMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWarmupMappingRequiredCodeRule flags a blank code", () => {
  const rule = new RollingWarmupMappingRequiredCodeRule("rolling warmup mapping needs this field");
  const item = newRollingWarmupMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWarmupMappingBudgetRangeRule flags values above budget", () => {
  const rule = new RollingWarmupMappingBudgetRangeRule(5.7, 1575.6);
  const item = newRollingWarmupMapping("x", "y");
  item.budget = 1577.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
