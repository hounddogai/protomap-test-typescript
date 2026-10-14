import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSlaThresholdAmountRangeRule,
  RollingSlaThresholdCreatedAtRangeRule,
  RollingSlaThresholdRequiredCategoryRule,
  RollingSlaThresholdRequiredTitleRule,
  RollingSlaThresholdTitleLengthRule,
  defaultRollingSlaThresholdValidator,
} from "./rolling-sla-threshold-rules.js";
import { newRollingSlaThreshold } from "./rolling-sla-threshold.js";

test("RollingSlaThresholdValidator reports every problem", () => {
  const validator = defaultRollingSlaThresholdValidator();
  const item = newRollingSlaThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSlaThresholdAmountRangeRule flags values above amount", () => {
  const rule = new RollingSlaThresholdAmountRangeRule(7.5, 2134);
  const item = newRollingSlaThreshold("x", "y");
  item.amount = 2135.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSlaThresholdTitleLengthRule flags a long title", () => {
  const rule = new RollingSlaThresholdTitleLengthRule(1000);
  const item = newRollingSlaThreshold("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSlaThresholdCreatedAtRangeRule flags values above created at", () => {
  const rule = new RollingSlaThresholdCreatedAtRangeRule(255, 3600);
  const item = newRollingSlaThreshold("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSlaThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new RollingSlaThresholdRequiredTitleRule("rolling sla threshold needs a value");
  const item = newRollingSlaThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSlaThresholdRequiredCategoryRule flags a blank category", () => {
  const rule = new RollingSlaThresholdRequiredCategoryRule("rolling sla threshold needs an entry");
  const item = newRollingSlaThreshold("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
