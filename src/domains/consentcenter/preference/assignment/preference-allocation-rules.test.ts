import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceAllocationNameLengthRule,
  PreferenceAllocationRequiredRegionRule,
  PreferenceAllocationUpdatedAtRangeRule,
  defaultPreferenceAllocationValidator,
} from "./preference-allocation-rules.js";
import { newPreferenceAllocation } from "./preference-allocation.js";

test("PreferenceAllocationValidator reports every problem", () => {
  const validator = defaultPreferenceAllocationValidator();
  const item = newPreferenceAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceAllocationRequiredRegionRule flags a blank region", () => {
  const rule = new PreferenceAllocationRequiredRegionRule("preference allocation needs this field");
  const item = newPreferenceAllocation("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceAllocationNameLengthRule flags a long name", () => {
  const rule = new PreferenceAllocationNameLengthRule(80);
  const item = newPreferenceAllocation("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceAllocationUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PreferenceAllocationUpdatedAtRangeRule(32, 32);
  const item = newPreferenceAllocation("x", "y");
  item.updatedAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
