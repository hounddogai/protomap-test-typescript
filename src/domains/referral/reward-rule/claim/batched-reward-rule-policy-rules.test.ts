import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedRewardRulePolicyFloorValueRangeRule,
  BatchedRewardRulePolicyRequiredTitleRule,
  BatchedRewardRulePolicyTitleLengthRule,
  defaultBatchedRewardRulePolicyValidator,
} from "./batched-reward-rule-policy-rules.js";
import { newBatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

test("BatchedRewardRulePolicyValidator reports every problem", () => {
  const validator = defaultBatchedRewardRulePolicyValidator();
  const item = newBatchedRewardRulePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedRewardRulePolicyTitleLengthRule flags a long title", () => {
  const rule = new BatchedRewardRulePolicyTitleLengthRule(3600);
  const item = newBatchedRewardRulePolicy("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRewardRulePolicyFloorValueRangeRule flags values above floor value", () => {
  const rule = new BatchedRewardRulePolicyFloorValueRangeRule(10, 959.2);
  const item = newBatchedRewardRulePolicy("x", "y");
  item.floorValue = 960.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedRewardRulePolicyRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedRewardRulePolicyRequiredTitleRule("batched reward rule policy needs this field");
  const item = newBatchedRewardRulePolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
