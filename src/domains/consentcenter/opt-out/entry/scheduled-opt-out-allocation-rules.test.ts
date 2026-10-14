import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledOptOutAllocationLimitRangeRule,
  ScheduledOptOutAllocationLocaleLengthRule,
  ScheduledOptOutAllocationRequiredLocaleRule,
  ScheduledOptOutAllocationRequiredTitleRule,
  defaultScheduledOptOutAllocationValidator,
} from "./scheduled-opt-out-allocation-rules.js";
import { newScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

test("ScheduledOptOutAllocationValidator reports every problem", () => {
  const validator = defaultScheduledOptOutAllocationValidator();
  const item = newScheduledOptOutAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledOptOutAllocationRequiredLocaleRule flags a blank locale", () => {
  const rule = new ScheduledOptOutAllocationRequiredLocaleRule("scheduled opt out allocation needs this field");
  const item = newScheduledOptOutAllocation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledOptOutAllocationLimitRangeRule flags values above limit", () => {
  const rule = new ScheduledOptOutAllocationLimitRangeRule(16, 86400);
  const item = newScheduledOptOutAllocation("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledOptOutAllocationRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledOptOutAllocationRequiredTitleRule("scheduled opt out allocation needs a value");
  const item = newScheduledOptOutAllocation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledOptOutAllocationLocaleLengthRule flags a long locale", () => {
  const rule = new ScheduledOptOutAllocationLocaleLengthRule(1000);
  const item = newScheduledOptOutAllocation("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
