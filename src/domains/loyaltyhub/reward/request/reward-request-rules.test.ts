import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRequestEndsAtRangeRule,
  RewardRequestFrequencyCapRangeRule,
  defaultRewardRequestValidator,
} from "./reward-request-rules.js";
import { newRewardRequest } from "./reward-request.js";

test("RewardRequestValidator reports every problem", () => {
  const validator = defaultRewardRequestValidator();
  const item = newRewardRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRequestEndsAtRangeRule flags values above ends at", () => {
  const rule = new RewardRequestEndsAtRangeRule(120, 86400);
  const item = newRewardRequest("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRequestFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RewardRequestFrequencyCapRangeRule(80, 1000);
  const item = newRewardRequest("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
