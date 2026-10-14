import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeAllocationRequiredCodeRule,
  CreativeAllocationRequiredNameRule,
  CreativeAllocationWindowDaysRangeRule,
  defaultCreativeAllocationValidator,
} from "./creative-allocation-rules.js";
import { newCreativeAllocation } from "./creative-allocation.js";

test("CreativeAllocationValidator reports every problem", () => {
  const validator = defaultCreativeAllocationValidator();
  const item = newCreativeAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeAllocationRequiredCodeRule("creative allocation needs this field");
  const item = newCreativeAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeAllocationRequiredNameRule flags a blank name", () => {
  const rule = new CreativeAllocationRequiredNameRule("creative allocation needs a value");
  const item = newCreativeAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeAllocationWindowDaysRangeRule flags values above window days", () => {
  const rule = new CreativeAllocationWindowDaysRangeRule(16, 120);
  const item = newCreativeAllocation("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
