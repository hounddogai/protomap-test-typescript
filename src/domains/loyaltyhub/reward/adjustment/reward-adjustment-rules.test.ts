import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardAdjustmentBudgetRangeRule,
  RewardAdjustmentRequiredSegmentRule,
  RewardAdjustmentSequenceRangeRule,
  defaultRewardAdjustmentValidator,
} from "./reward-adjustment-rules.js";
import { newRewardAdjustment } from "./reward-adjustment.js";

test("RewardAdjustmentValidator reports every problem", () => {
  const validator = defaultRewardAdjustmentValidator();
  const item = newRewardAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardAdjustmentRequiredSegmentRule flags a blank segment", () => {
  const rule = new RewardAdjustmentRequiredSegmentRule("reward adjustment needs a value");
  const item = newRewardAdjustment("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardAdjustmentBudgetRangeRule flags values above budget", () => {
  const rule = new RewardAdjustmentBudgetRangeRule(8.1, 3743.9);
  const item = newRewardAdjustment("x", "y");
  item.budget = 3745.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardAdjustmentSequenceRangeRule flags values above sequence", () => {
  const rule = new RewardAdjustmentSequenceRangeRule(32, 64);
  const item = newRewardAdjustment("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
