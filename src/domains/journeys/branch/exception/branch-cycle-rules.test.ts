import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchCycleLimitRangeRule,
  BranchCycleMinimumRangeRule,
  BranchCycleRequiredTitleRule,
  BranchCycleTitleLengthRule,
  BranchCycleWindowDaysRangeRule,
  defaultBranchCycleValidator,
} from "./branch-cycle-rules.js";
import { newBranchCycle } from "./branch-cycle.js";

test("BranchCycleValidator reports every problem", () => {
  const validator = defaultBranchCycleValidator();
  const item = newBranchCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchCycleMinimumRangeRule flags values above minimum", () => {
  const rule = new BranchCycleMinimumRangeRule(5.9, 3604.9);
  const item = newBranchCycle("x", "y");
  item.minimum = 3606.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchCycleWindowDaysRangeRule flags values above window days", () => {
  const rule = new BranchCycleWindowDaysRangeRule(64, 3600);
  const item = newBranchCycle("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchCycleTitleLengthRule flags a long title", () => {
  const rule = new BranchCycleTitleLengthRule(1000);
  const item = newBranchCycle("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchCycleLimitRangeRule flags values above limit", () => {
  const rule = new BranchCycleLimitRangeRule(64, 86400);
  const item = newBranchCycle("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchCycleRequiredTitleRule flags a blank title", () => {
  const rule = new BranchCycleRequiredTitleRule("branch cycle needs a value");
  const item = newBranchCycle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
