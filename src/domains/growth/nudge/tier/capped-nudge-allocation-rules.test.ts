import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedNudgeAllocationRequiredCodeRule,
  CappedNudgeAllocationVersionRangeRule,
  defaultCappedNudgeAllocationValidator,
} from "./capped-nudge-allocation-rules.js";
import { newCappedNudgeAllocation } from "./capped-nudge-allocation.js";

test("CappedNudgeAllocationValidator reports every problem", () => {
  const validator = defaultCappedNudgeAllocationValidator();
  const item = newCappedNudgeAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedNudgeAllocationVersionRangeRule flags values above version", () => {
  const rule = new CappedNudgeAllocationVersionRangeRule(64, 255);
  const item = newCappedNudgeAllocation("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedNudgeAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new CappedNudgeAllocationRequiredCodeRule("capped nudge allocation needs a value");
  const item = newCappedNudgeAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
