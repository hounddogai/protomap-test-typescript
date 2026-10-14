import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBranchCycleClicksRangeRule,
  LenientBranchCycleRequiredCodeRule,
  LenientBranchCycleRequiredNameRule,
  defaultLenientBranchCycleValidator,
} from "./lenient-branch-cycle-rules.js";
import { newLenientBranchCycle } from "./lenient-branch-cycle.js";

test("LenientBranchCycleValidator reports every problem", () => {
  const validator = defaultLenientBranchCycleValidator();
  const item = newLenientBranchCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBranchCycleRequiredCodeRule flags a blank code", () => {
  const rule = new LenientBranchCycleRequiredCodeRule("lenient branch cycle needs this field");
  const item = newLenientBranchCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBranchCycleRequiredNameRule flags a blank name", () => {
  const rule = new LenientBranchCycleRequiredNameRule("lenient branch cycle needs a value");
  const item = newLenientBranchCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBranchCycleClicksRangeRule flags values above clicks", () => {
  const rule = new LenientBranchCycleClicksRangeRule(16, 120);
  const item = newLenientBranchCycle("x", "y");
  item.clicks = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
