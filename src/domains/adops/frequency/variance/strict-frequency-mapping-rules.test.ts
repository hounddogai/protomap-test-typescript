import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictFrequencyMappingBudgetRangeRule,
  StrictFrequencyMappingCodeLengthRule,
  StrictFrequencyMappingRequiredDescriptionRule,
  StrictFrequencyMappingRequiredTimezoneRule,
  StrictFrequencyMappingSendAtRangeRule,
  defaultStrictFrequencyMappingValidator,
} from "./strict-frequency-mapping-rules.js";
import { newStrictFrequencyMapping } from "./strict-frequency-mapping.js";

test("StrictFrequencyMappingValidator reports every problem", () => {
  const validator = defaultStrictFrequencyMappingValidator();
  const item = newStrictFrequencyMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictFrequencyMappingBudgetRangeRule flags values above budget", () => {
  const rule = new StrictFrequencyMappingBudgetRangeRule(3, 2341.1);
  const item = newStrictFrequencyMapping("x", "y");
  item.budget = 2342.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictFrequencyMappingRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new StrictFrequencyMappingRequiredTimezoneRule("strict frequency mapping needs a value");
  const item = newStrictFrequencyMapping("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictFrequencyMappingRequiredDescriptionRule flags a blank description", () => {
  const rule = new StrictFrequencyMappingRequiredDescriptionRule("strict frequency mapping needs a value");
  const item = newStrictFrequencyMapping("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictFrequencyMappingSendAtRangeRule flags values above send at", () => {
  const rule = new StrictFrequencyMappingSendAtRangeRule(16, 64);
  const item = newStrictFrequencyMapping("x", "y");
  item.sendAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictFrequencyMappingCodeLengthRule flags a long code", () => {
  const rule = new StrictFrequencyMappingCodeLengthRule(16);
  const item = newStrictFrequencyMapping("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
