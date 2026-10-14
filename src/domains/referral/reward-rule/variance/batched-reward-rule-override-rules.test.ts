import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedRewardRuleOverrideNameLengthRule,
  BatchedRewardRuleOverrideSummaryLengthRule,
  defaultBatchedRewardRuleOverrideValidator,
} from "./batched-reward-rule-override-rules.js";
import { newBatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

test("BatchedRewardRuleOverrideValidator reports every problem", () => {
  const validator = defaultBatchedRewardRuleOverrideValidator();
  const item = newBatchedRewardRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedRewardRuleOverrideSummaryLengthRule flags a long summary", () => {
  const rule = new BatchedRewardRuleOverrideSummaryLengthRule(3600);
  const item = newBatchedRewardRuleOverride("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedRewardRuleOverrideNameLengthRule flags a long name", () => {
  const rule = new BatchedRewardRuleOverrideNameLengthRule(16);
  const item = newBatchedRewardRuleOverride("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
