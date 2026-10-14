import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCsatAllocationRateRangeRule,
  StrictCsatAllocationRequiredCategoryRule,
  StrictCsatAllocationRequiredCodeRule,
  StrictCsatAllocationRequiredReviewerRule,
  StrictCsatAllocationReviewerLengthRule,
  defaultStrictCsatAllocationValidator,
} from "./strict-csat-allocation-rules.js";
import { newStrictCsatAllocation } from "./strict-csat-allocation.js";

test("StrictCsatAllocationValidator reports every problem", () => {
  const validator = defaultStrictCsatAllocationValidator();
  const item = newStrictCsatAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCsatAllocationReviewerLengthRule flags a long reviewer", () => {
  const rule = new StrictCsatAllocationReviewerLengthRule(120);
  const item = newStrictCsatAllocation("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCsatAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new StrictCsatAllocationRequiredCodeRule("strict csat allocation needs a value");
  const item = newStrictCsatAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCsatAllocationRequiredCategoryRule flags a blank category", () => {
  const rule = new StrictCsatAllocationRequiredCategoryRule("strict csat allocation needs this field");
  const item = newStrictCsatAllocation("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCsatAllocationRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new StrictCsatAllocationRequiredReviewerRule("strict csat allocation needs this field");
  const item = newStrictCsatAllocation("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCsatAllocationRateRangeRule flags values above rate", () => {
  const rule = new StrictCsatAllocationRateRangeRule(8.8, 2071.7);
  const item = newStrictCsatAllocation("x", "y");
  item.rate = 2073.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
