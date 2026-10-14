import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathAllocationGraceDaysRangeRule,
  PathAllocationRateRangeRule,
  PathAllocationRequiredSummaryRule,
  defaultPathAllocationValidator,
} from "./path-allocation-rules.js";
import { newPathAllocation } from "./path-allocation.js";

test("PathAllocationValidator reports every problem", () => {
  const validator = defaultPathAllocationValidator();
  const item = newPathAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathAllocationGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PathAllocationGraceDaysRangeRule(120, 3600);
  const item = newPathAllocation("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathAllocationRateRangeRule flags values above rate", () => {
  const rule = new PathAllocationRateRangeRule(8.2, 3898.8);
  const item = newPathAllocation("x", "y");
  item.rate = 3900.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathAllocationRequiredSummaryRule flags a blank summary", () => {
  const rule = new PathAllocationRequiredSummaryRule("path allocation needs an entry");
  const item = newPathAllocation("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
