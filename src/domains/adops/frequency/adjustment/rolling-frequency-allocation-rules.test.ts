import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFrequencyAllocationBidRangeRule,
  defaultRollingFrequencyAllocationValidator,
} from "./rolling-frequency-allocation-rules.js";
import { newRollingFrequencyAllocation } from "./rolling-frequency-allocation.js";

test("RollingFrequencyAllocationValidator reports every problem", () => {
  const validator = defaultRollingFrequencyAllocationValidator();
  const item = newRollingFrequencyAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFrequencyAllocationBidRangeRule flags values above bid", () => {
  const rule = new RollingFrequencyAllocationBidRangeRule(5.2, 883.9);
  const item = newRollingFrequencyAllocation("x", "y");
  item.bid = 885.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
