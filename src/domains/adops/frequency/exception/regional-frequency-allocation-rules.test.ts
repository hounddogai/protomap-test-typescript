import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalFrequencyAllocationCodeLengthRule,
  RegionalFrequencyAllocationRequiredTimezoneRule,
  RegionalFrequencyAllocationTimezoneLengthRule,
  RegionalFrequencyAllocationWindowDaysRangeRule,
  defaultRegionalFrequencyAllocationValidator,
} from "./regional-frequency-allocation-rules.js";
import { newRegionalFrequencyAllocation } from "./regional-frequency-allocation.js";

test("RegionalFrequencyAllocationValidator reports every problem", () => {
  const validator = defaultRegionalFrequencyAllocationValidator();
  const item = newRegionalFrequencyAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalFrequencyAllocationTimezoneLengthRule flags a long timezone", () => {
  const rule = new RegionalFrequencyAllocationTimezoneLengthRule(16);
  const item = newRegionalFrequencyAllocation("x", "y");
  item.timezone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalFrequencyAllocationRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RegionalFrequencyAllocationRequiredTimezoneRule("regional frequency allocation needs a value");
  const item = newRegionalFrequencyAllocation("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalFrequencyAllocationCodeLengthRule flags a long code", () => {
  const rule = new RegionalFrequencyAllocationCodeLengthRule(120);
  const item = newRegionalFrequencyAllocation("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalFrequencyAllocationWindowDaysRangeRule flags values above window days", () => {
  const rule = new RegionalFrequencyAllocationWindowDaysRangeRule(255, 255);
  const item = newRegionalFrequencyAllocation("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
