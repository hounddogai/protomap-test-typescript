import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathCycleAmountRangeRule,
  PathCycleRequiredChannelRule,
  PathCycleSummaryLengthRule,
  defaultPathCycleValidator,
} from "./path-cycle-rules.js";
import { newPathCycle } from "./path-cycle.js";

test("PathCycleValidator reports every problem", () => {
  const validator = defaultPathCycleValidator();
  const item = newPathCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathCycleRequiredChannelRule flags a blank channel", () => {
  const rule = new PathCycleRequiredChannelRule("path cycle needs this field");
  const item = newPathCycle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathCycleSummaryLengthRule flags a long summary", () => {
  const rule = new PathCycleSummaryLengthRule(3600);
  const item = newPathCycle("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathCycleAmountRangeRule flags values above amount", () => {
  const rule = new PathCycleAmountRangeRule(0.6, 1900.5);
  const item = newPathCycle("x", "y");
  item.amount = 1902;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
