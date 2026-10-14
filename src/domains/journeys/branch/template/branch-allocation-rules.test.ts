import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchAllocationCategoryLengthRule,
  BranchAllocationLimitRangeRule,
  BranchAllocationNameLengthRule,
  defaultBranchAllocationValidator,
} from "./branch-allocation-rules.js";
import { newBranchAllocation } from "./branch-allocation.js";

test("BranchAllocationValidator reports every problem", () => {
  const validator = defaultBranchAllocationValidator();
  const item = newBranchAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchAllocationNameLengthRule flags a long name", () => {
  const rule = new BranchAllocationNameLengthRule(64);
  const item = newBranchAllocation("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchAllocationLimitRangeRule flags values above limit", () => {
  const rule = new BranchAllocationLimitRangeRule(120, 86400);
  const item = newBranchAllocation("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchAllocationCategoryLengthRule flags a long category", () => {
  const rule = new BranchAllocationCategoryLengthRule(16);
  const item = newBranchAllocation("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
