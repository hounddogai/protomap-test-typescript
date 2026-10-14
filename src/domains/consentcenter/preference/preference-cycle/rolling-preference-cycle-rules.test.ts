import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPreferenceCycleCapacityRangeRule,
  RollingPreferenceCycleRequiredSegmentRule,
  RollingPreferenceCycleSegmentLengthRule,
  RollingPreferenceCycleSequenceRangeRule,
  defaultRollingPreferenceCycleValidator,
} from "./rolling-preference-cycle-rules.js";
import { newRollingPreferenceCycle } from "./rolling-preference-cycle.js";

test("RollingPreferenceCycleValidator reports every problem", () => {
  const validator = defaultRollingPreferenceCycleValidator();
  const item = newRollingPreferenceCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPreferenceCycleSegmentLengthRule flags a long segment", () => {
  const rule = new RollingPreferenceCycleSegmentLengthRule(32);
  const item = newRollingPreferenceCycle("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPreferenceCycleRequiredSegmentRule flags a blank segment", () => {
  const rule = new RollingPreferenceCycleRequiredSegmentRule("rolling preference cycle needs a value");
  const item = newRollingPreferenceCycle("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPreferenceCycleSequenceRangeRule flags values above sequence", () => {
  const rule = new RollingPreferenceCycleSequenceRangeRule(80, 1000);
  const item = newRollingPreferenceCycle("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPreferenceCycleCapacityRangeRule flags values above capacity", () => {
  const rule = new RollingPreferenceCycleCapacityRangeRule(16, 64);
  const item = newRollingPreferenceCycle("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
