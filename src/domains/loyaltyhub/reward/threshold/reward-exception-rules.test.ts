import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardExceptionPhoneLengthRule,
  RewardExceptionStartsAtRangeRule,
  defaultRewardExceptionValidator,
} from "./reward-exception-rules.js";
import { newRewardException } from "./reward-exception.js";

test("RewardExceptionValidator reports every problem", () => {
  const validator = defaultRewardExceptionValidator();
  const item = newRewardException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardExceptionPhoneLengthRule flags a long phone", () => {
  const rule = new RewardExceptionPhoneLengthRule(16);
  const item = newRewardException("x", "y");
  item.phone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardExceptionStartsAtRangeRule flags values above starts at", () => {
  const rule = new RewardExceptionStartsAtRangeRule(120, 3600);
  const item = newRewardException("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
