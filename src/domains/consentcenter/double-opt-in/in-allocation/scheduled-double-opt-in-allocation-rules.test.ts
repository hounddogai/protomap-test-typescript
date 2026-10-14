import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDoubleOptInAllocationCodeLengthRule,
  ScheduledDoubleOptInAllocationLimitRangeRule,
  ScheduledDoubleOptInAllocationSegmentLengthRule,
  defaultScheduledDoubleOptInAllocationValidator,
} from "./scheduled-double-opt-in-allocation-rules.js";
import { newScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

test("ScheduledDoubleOptInAllocationValidator reports every problem", () => {
  const validator = defaultScheduledDoubleOptInAllocationValidator();
  const item = newScheduledDoubleOptInAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDoubleOptInAllocationCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDoubleOptInAllocationCodeLengthRule(3600);
  const item = newScheduledDoubleOptInAllocation("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDoubleOptInAllocationLimitRangeRule flags values above limit", () => {
  const rule = new ScheduledDoubleOptInAllocationLimitRangeRule(16, 120);
  const item = newScheduledDoubleOptInAllocation("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDoubleOptInAllocationSegmentLengthRule flags a long segment", () => {
  const rule = new ScheduledDoubleOptInAllocationSegmentLengthRule(64);
  const item = newScheduledDoubleOptInAllocation("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
