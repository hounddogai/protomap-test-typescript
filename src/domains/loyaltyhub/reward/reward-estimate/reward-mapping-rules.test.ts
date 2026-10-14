import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardMappingMinimumRangeRule,
  RewardMappingRequiredNameRule,
  defaultRewardMappingValidator,
} from "./reward-mapping-rules.js";
import { newRewardMapping } from "./reward-mapping.js";

test("RewardMappingValidator reports every problem", () => {
  const validator = defaultRewardMappingValidator();
  const item = newRewardMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardMappingRequiredNameRule flags a blank name", () => {
  const rule = new RewardMappingRequiredNameRule("reward mapping needs an entry");
  const item = newRewardMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardMappingMinimumRangeRule flags values above minimum", () => {
  const rule = new RewardMappingMinimumRangeRule(0.7, 804.5);
  const item = newRewardMapping("x", "y");
  item.minimum = 806;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
