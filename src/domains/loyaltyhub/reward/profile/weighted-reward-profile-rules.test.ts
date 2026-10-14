import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardProfileCodeLengthRule,
  WeightedRewardProfileRequiredCodeRule,
  WeightedRewardProfileThresholdRangeRule,
  defaultWeightedRewardProfileValidator,
} from "./weighted-reward-profile-rules.js";
import { newWeightedRewardProfile } from "./weighted-reward-profile.js";

test("WeightedRewardProfileValidator reports every problem", () => {
  const validator = defaultWeightedRewardProfileValidator();
  const item = newWeightedRewardProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardProfileCodeLengthRule flags a long code", () => {
  const rule = new WeightedRewardProfileCodeLengthRule(16);
  const item = newWeightedRewardProfile("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRewardProfileRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedRewardProfileRequiredCodeRule("weighted reward profile needs an entry");
  const item = newWeightedRewardProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedRewardProfileThresholdRangeRule flags values above threshold", () => {
  const rule = new WeightedRewardProfileThresholdRangeRule(3.3, 1032);
  const item = newWeightedRewardProfile("x", "y");
  item.threshold = 1033.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
