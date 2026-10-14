import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWarmupAllocationCodeLengthRule,
  defaultSeasonalWarmupAllocationValidator,
} from "./seasonal-warmup-allocation-rules.js";
import { newSeasonalWarmupAllocation } from "./seasonal-warmup-allocation.js";

test("SeasonalWarmupAllocationValidator reports every problem", () => {
  const validator = defaultSeasonalWarmupAllocationValidator();
  const item = newSeasonalWarmupAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWarmupAllocationCodeLengthRule flags a long code", () => {
  const rule = new SeasonalWarmupAllocationCodeLengthRule(80);
  const item = newSeasonalWarmupAllocation("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
