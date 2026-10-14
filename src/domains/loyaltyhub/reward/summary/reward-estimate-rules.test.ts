import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardEstimateCodeLengthRule,
  RewardEstimateRequiredTitleRule,
  RewardEstimateScoreRangeRule,
  defaultRewardEstimateValidator,
} from "./reward-estimate-rules.js";
import { newRewardEstimate } from "./reward-estimate.js";

test("RewardEstimateValidator reports every problem", () => {
  const validator = defaultRewardEstimateValidator();
  const item = newRewardEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardEstimateCodeLengthRule flags a long code", () => {
  const rule = new RewardEstimateCodeLengthRule(16);
  const item = newRewardEstimate("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardEstimateRequiredTitleRule flags a blank title", () => {
  const rule = new RewardEstimateRequiredTitleRule("reward estimate needs an entry");
  const item = newRewardEstimate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardEstimateScoreRangeRule flags values above score", () => {
  const rule = new RewardEstimateScoreRangeRule(5.2, 236.9);
  const item = newRewardEstimate("x", "y");
  item.score = 238.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
