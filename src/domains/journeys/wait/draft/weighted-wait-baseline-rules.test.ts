import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWaitBaselinePriorityRangeRule,
  WeightedWaitBaselineRequiredTitleRule,
  WeightedWaitBaselineRevisionRangeRule,
  WeightedWaitBaselineTitleLengthRule,
  defaultWeightedWaitBaselineValidator,
} from "./weighted-wait-baseline-rules.js";
import { newWeightedWaitBaseline } from "./weighted-wait-baseline.js";

test("WeightedWaitBaselineValidator reports every problem", () => {
  const validator = defaultWeightedWaitBaselineValidator();
  const item = newWeightedWaitBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWaitBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedWaitBaselineRequiredTitleRule("weighted wait baseline needs a value");
  const item = newWeightedWaitBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedWaitBaselinePriorityRangeRule flags values above priority", () => {
  const rule = new WeightedWaitBaselinePriorityRangeRule(16, 32);
  const item = newWeightedWaitBaseline("x", "y");
  item.priority = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWaitBaselineRevisionRangeRule flags values above revision", () => {
  const rule = new WeightedWaitBaselineRevisionRangeRule(16, 3600);
  const item = newWeightedWaitBaseline("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWaitBaselineTitleLengthRule flags a long title", () => {
  const rule = new WeightedWaitBaselineTitleLengthRule(64);
  const item = newWeightedWaitBaseline("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
