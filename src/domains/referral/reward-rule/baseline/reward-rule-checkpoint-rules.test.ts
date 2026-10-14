import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleCheckpointEndsAtRangeRule,
  RewardRuleCheckpointNameLengthRule,
  RewardRuleCheckpointPriorityRangeRule,
  RewardRuleCheckpointQuantityRangeRule,
  RewardRuleCheckpointRequiredTimezoneRule,
  RewardRuleCheckpointUpdatedAtRangeRule,
  defaultRewardRuleCheckpointValidator,
} from "./reward-rule-checkpoint-rules.js";
import { newRewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

test("RewardRuleCheckpointValidator reports every problem", () => {
  const validator = defaultRewardRuleCheckpointValidator();
  const item = newRewardRuleCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleCheckpointPriorityRangeRule flags values above priority", () => {
  const rule = new RewardRuleCheckpointPriorityRangeRule(120, 120);
  const item = newRewardRuleCheckpoint("x", "y");
  item.priority = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleCheckpointQuantityRangeRule flags values above quantity", () => {
  const rule = new RewardRuleCheckpointQuantityRangeRule(64, 86400);
  const item = newRewardRuleCheckpoint("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleCheckpointRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RewardRuleCheckpointRequiredTimezoneRule("reward rule checkpoint needs an entry");
  const item = newRewardRuleCheckpoint("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleCheckpointNameLengthRule flags a long name", () => {
  const rule = new RewardRuleCheckpointNameLengthRule(32);
  const item = newRewardRuleCheckpoint("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleCheckpointEndsAtRangeRule flags values above ends at", () => {
  const rule = new RewardRuleCheckpointEndsAtRangeRule(80, 3600);
  const item = newRewardRuleCheckpoint("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleCheckpointUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RewardRuleCheckpointUpdatedAtRangeRule(32, 86400);
  const item = newRewardRuleCheckpoint("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
