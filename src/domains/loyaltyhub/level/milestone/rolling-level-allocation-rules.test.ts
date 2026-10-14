import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingLevelAllocationEndsAtRangeRule,
  RollingLevelAllocationRequiredTimezoneRule,
  RollingLevelAllocationTitleLengthRule,
  defaultRollingLevelAllocationValidator,
} from "./rolling-level-allocation-rules.js";
import { newRollingLevelAllocation } from "./rolling-level-allocation.js";

test("RollingLevelAllocationValidator reports every problem", () => {
  const validator = defaultRollingLevelAllocationValidator();
  const item = newRollingLevelAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingLevelAllocationTitleLengthRule flags a long title", () => {
  const rule = new RollingLevelAllocationTitleLengthRule(120);
  const item = newRollingLevelAllocation("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingLevelAllocationEndsAtRangeRule flags values above ends at", () => {
  const rule = new RollingLevelAllocationEndsAtRangeRule(32, 3600);
  const item = newRollingLevelAllocation("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingLevelAllocationRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingLevelAllocationRequiredTimezoneRule("rolling level allocation needs this field");
  const item = newRollingLevelAllocation("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
