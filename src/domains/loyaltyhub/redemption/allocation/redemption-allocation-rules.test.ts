import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionAllocationCategoryLengthRule,
  RedemptionAllocationRatioRangeRule,
  RedemptionAllocationRequiredTitleRule,
  RedemptionAllocationTitleLengthRule,
  defaultRedemptionAllocationValidator,
} from "./redemption-allocation-rules.js";
import { newRedemptionAllocation } from "./redemption-allocation.js";

test("RedemptionAllocationValidator reports every problem", () => {
  const validator = defaultRedemptionAllocationValidator();
  const item = newRedemptionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionAllocationTitleLengthRule flags a long title", () => {
  const rule = new RedemptionAllocationTitleLengthRule(120);
  const item = newRedemptionAllocation("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAllocationCategoryLengthRule flags a long category", () => {
  const rule = new RedemptionAllocationCategoryLengthRule(86400);
  const item = newRedemptionAllocation("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAllocationRequiredTitleRule flags a blank title", () => {
  const rule = new RedemptionAllocationRequiredTitleRule("redemption allocation needs a value");
  const item = newRedemptionAllocation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionAllocationRatioRangeRule flags values above ratio", () => {
  const rule = new RedemptionAllocationRatioRangeRule(5.7, 4757.7);
  const item = newRedemptionAllocation("x", "y");
  item.ratio = 4759.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
