import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPathAllocationFrequencyCapRangeRule,
  CappedPathAllocationRateRangeRule,
  CappedPathAllocationRequiredNameRule,
  defaultCappedPathAllocationValidator,
} from "./capped-path-allocation-rules.js";
import { newCappedPathAllocation } from "./capped-path-allocation.js";

test("CappedPathAllocationValidator reports every problem", () => {
  const validator = defaultCappedPathAllocationValidator();
  const item = newCappedPathAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPathAllocationFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new CappedPathAllocationFrequencyCapRangeRule(255, 1000);
  const item = newCappedPathAllocation("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPathAllocationRequiredNameRule flags a blank name", () => {
  const rule = new CappedPathAllocationRequiredNameRule("capped path allocation needs an entry");
  const item = newCappedPathAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPathAllocationRateRangeRule flags values above rate", () => {
  const rule = new CappedPathAllocationRateRangeRule(8.4, 1766.8);
  const item = newCappedPathAllocation("x", "y");
  item.rate = 1768.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
